import express from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import { authenticate } from "./auth.js";
import { censorText } from "../utils/censor.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();
const prisma = new PrismaClient();

// Multer Storage for Report Images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "src/uploads/reports";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `report-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get list of forums with pagination, search, and sorting
router.get("/", async (req, res, next) => {
  try {
    const skip = parseInt(req.query.skip) || 0;
    const take = parseInt(req.query.take) || 10;
    const search = req.query.search || "";
    const sortBy = req.query.sortBy || "newest";

    const where = search
      ? {
          konyv_cim: {
            contains: search,
          },
        }
      : {};

    let orderBy = { letrehozva: "desc" };
    if (sortBy === "oldest") orderBy = { letrehozva: "asc" };
    else if (sortBy === "popular") orderBy = { up_szavazatok: "desc" };
    else if (sortBy === "downvoted") orderBy = { down_szavazatok: "desc" };

    const posts = await prisma.forumBejegyzes.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        Felhasznalo: {
          select: {
            felhasznalonev: true,
            profilkep: true,
          },
        },
        _count: {
          select: { 
            Hozzaszolasok: true,
            Szavazatok: true,
            Reakciok: true 
          },
        },
        Reakciok: {
          take: 50, // for summary counts
          select: {
            emoji: true
          }
        }
      },
    });

    // Formázás: reakció-összesítés hozzáadása
    const formattedPosts = posts.map(post => {
      const reactionCounts = post.Reakciok.reduce((acc, r) => {
        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
        return acc;
      }, {});
      
      const { Reakciok, ...rest } = post;
      return { 
        ...rest, 
        reactionSummary: reactionCounts 
      };
    });

    const total = await prisma.forumBejegyzes.count({ where });

    res.json({
      posts: formattedPosts,
      total,
      hasMore: skip + posts.length < total,
    });
  } catch (error) {
    next(error);
  }
});

// Get single forum post by ID with comments and detailed vote/reaction info
router.get("/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const post = await prisma.forumBejegyzes.findUnique({
      where: { id },
      include: {
        Felhasznalo: {
          select: {
            felhasznalonev: true,
            profilkep: true,
          },
        },
        Hozzaszolasok: {
          include: {
            Felhasznalo: {
              select: {
                felhasznalo_id: true,
                felhasznalonev: true,
                profilkep: true,
              },
            },
            Reakciok: {
                select: {
                    felhasznalo_id: true,
                    emoji: true
                }
            }
          },
          orderBy: {
            letrehozva: "asc",
          },
        },
        Szavazatok: {
            select: {
                felhasznalo_id: true,
                ertek: true
            }
        },
        Reakciok: {
            select: {
                felhasznalo_id: true,
                emoji: true
            }
        }
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(post);
  } catch (error) {
    next(error);
  }
});

// Create new forum post
router.post("/", authenticate, async (req, res, next) => {
  // ... (stays identical, just keeping for context in large edit)
  try {
    const { konyv_id, konyv_cim, konyv_boritokep, cim, tartalom, ertekeles } = req.body;
    const felhasznalo_id = req.user.userId;

    if (!konyv_id || !konyv_cim || !cim || !tartalom || ertekeles === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const censoredCim = await censorText(cim);
    const censoredTartalom = await censorText(tartalom);

    const post = await prisma.forumBejegyzes.create({
      data: {
        felhasznalo_id, 
        konyv_id, 
        konyv_cim, 
        konyv_boritokep, 
        cim: censoredCim, 
        tartalom: censoredTartalom, 
        ertekeles
      },
    });
    res.status(201).json(post);
  } catch (error) { next(error); }
});

// Add vote (Up/Down) to a post
router.post("/:id/vote", authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { ertek } = req.body; // 1 or -1
    const felhasznalo_id = req.user.userId;

    if (ertek !== 1 && ertek !== -1) {
      return res.status(400).json({ error: "Value must be 1 or -1" });
    }

    // Tranzakció: szavazat kezelése és számlálók frissítése
    await prisma.$transaction(async (tx) => {
      const existing = await tx.forumSzavazat.findUnique({
        where: { unique_forum_szavazat: { bejegyzes_id: id, felhasznalo_id } }
      });

      if (existing) {
        if (existing.ertek === ertek) {
          // Toggle ki: törlés
          await tx.forumSzavazat.delete({ where: { id: existing.id } });
          await tx.forumBejegyzes.update({
            where: { id },
            data: {
              up_szavazatok: ertek === 1 ? { decrement: 1 } : undefined,
              down_szavazatok: ertek === -1 ? { decrement: 1 } : undefined,
            }
          });
        } else {
          // Váltás: up -> down vagy fordítva
          await tx.forumSzavazat.update({
            where: { id: existing.id },
            data: { ertek }
          });
          await tx.forumBejegyzes.update({
            where: { id },
            data: {
              up_szavazatok: ertek === 1 ? { increment: 1 } : { decrement: 1 },
              down_szavazatok: ertek === -1 ? { increment: 1 } : { decrement: 1 },
            }
          });
        }
      } else {
        // Új szavazat
        await tx.forumSzavazat.create({
          data: { bejegyzes_id: id, felhasznalo_id, ertek }
        });
        await tx.forumBejegyzes.update({
          where: { id },
          data: {
            up_szavazatok: ertek === 1 ? { increment: 1 } : undefined,
            down_szavazatok: ertek === -1 ? { increment: 1 } : undefined,
          }
        });
      }
    });

    const updated = await prisma.forumBejegyzes.findUnique({
      where: { id },
      select: { up_szavazatok: true, down_szavazatok: true }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Add emoji reaction to a post
const ALLOWED_EMOJIS = ["❤️", "👍", "🤣", "😭", "😠", "😊"];
router.post("/:id/react", authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { emoji } = req.body;
    const felhasznalo_id = req.user.userId;

    if (!ALLOWED_EMOJIS.includes(emoji)) {
      return res.status(400).json({ error: "Invalid emoji" });
    }

    const existing = await prisma.forumReakcio.findMany({
      where: { bejegyzes_id: id, felhasznalo_id }
    });

    const hasThisEmoji = existing.find(r => r.emoji === emoji);

    if (hasThisEmoji) {
      // Toggle ki
      await prisma.forumReakcio.delete({ where: { id: hasThisEmoji.id } });
    } else {
      // Új reakció, de ellenőrizzük a limitet (3 különböző emoji / user)
      if (existing.length >= 3) {
        return res.status(400).json({ error: "You can only have up to 3 different emoji reactions per post." });
      }
      await prisma.forumReakcio.create({
        data: { bejegyzes_id: id, felhasznalo_id, emoji }
      });
    }

    // Frissített reakciók lekérése a válaszhoz
    const updatedReactions = await prisma.forumReakcio.findMany({
      where: { bejegyzes_id: id },
      select: { emoji: true, felhasznalo_id: true }
    });

    res.json(updatedReactions);
  } catch (error) {
    next(error);
  }
});

// Add comment to a post
router.post("/:id/comments", authenticate, async (req, res, next) => {
  // ... (stays identical, keeping for context reference)
  try {
    const { tartalom } = req.body;
    const bejegyzes_id = parseInt(req.params.id);
    const felhasznalo_id = req.user.userId;

    if (!tartalom || tartalom.trim() === "") return res.status(400).json({ error: "Comment content cannot be empty" });

    const censoredTartalom = await censorText(tartalom);

    const comment = await prisma.forumHozzaszolas.create({
      data: { bejegyzes_id, felhasznalo_id, tartalom: censoredTartalom },
      include: { Felhasznalo: { select: { felhasznalonev: true, profilkep: true } } },
    });
    res.status(201).json(comment);
  } catch (error) { next(error); }
});

// Delete a forum post (Admin only)
router.delete("/posts/:id", authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    // Biztonsági ellenőrzés: csak admin törölhet bejegyzést
    if (req.user.szerepkor !== 'ADMIN') {
      return res.status(403).json({ error: "Only administrators can delete discussion posts." });
    }

    await prisma.forumBejegyzes.delete({ where: { id } });
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: "Post not found" });
    next(error);
  }
});

// Delete a comment (Admin or OP)
router.delete("/comments/:id", authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const comment = await prisma.forumHozzaszolas.findUnique({
      where: { id },
      select: { felhasznalo_id: true }
    });

    if (!comment) return res.status(404).json({ error: "Comment not found" });

    // Ellenőrzés: Admin VAGY a hozzászólás írója
    if (req.user.szerepkor !== 'ADMIN' && req.user.userId !== comment.felhasznalo_id) {
      return res.status(403).json({ error: "You don't have permission to delete this comment." });
    }

    await prisma.forumHozzaszolas.delete({ where: { id } });
    res.json({ message: "Comment deleted successfully" });
  } catch (error) { next(error); }
});

// REPORT POST
router.post("/:id/report", authenticate, upload.single("image"), async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const { tipus, leiras } = req.body;
        const reporterId = req.user.userId;

        const report = await prisma.forumReport.create({
            data: {
                felhasznalo_id: reporterId,
                bejegyzes_id: id,
                tipus,
                leiras: leiras || null,
                kep_url: req.file ? `/uploads/reports/${req.file.filename}` : null
            }
        });
        res.status(201).json(report);
    } catch (error) { next(error); }
});

// REPORT COMMENT
router.post("/comments/:id/report", authenticate, upload.single("image"), async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const { tipus, leiras } = req.body;
        const reporterId = req.user.userId;

        const report = await prisma.forumReport.create({
            data: {
                felhasznalo_id: reporterId,
                hozzaszolas_id: id,
                tipus,
                leiras: leiras || null,
                kep_url: req.file ? `/uploads/reports/${req.file.filename}` : null
            }
        });
        res.status(201).json(report);
    } catch (error) { next(error); }
});

// COMMENT REACTIONS
router.post("/comments/:id/react", authenticate, async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const { emoji } = req.body;
        const felhasznalo_id = req.user.userId;

        if (!ALLOWED_EMOJIS.includes(emoji)) return res.status(400).json({ error: "Invalid emoji" });

        const existing = await prisma.forumHozzaszolasReakcio.findMany({
            where: { hozzaszolas_id: id, felhasznalo_id }
        });

        const hasThisEmoji = existing.find(r => r.emoji === emoji);
        if (hasThisEmoji) {
            await prisma.forumHozzaszolasReakcio.delete({ where: { id: hasThisEmoji.id } });
        } else {
            if (existing.length >= 3) return res.status(400).json({ error: "Up to 3 reactions only." });
            await prisma.forumHozzaszolasReakcio.create({
                data: { hozzaszolas_id: id, felhasznalo_id, emoji }
            });
        }

        const updated = await prisma.forumHozzaszolasReakcio.findMany({
            where: { hozzaszolas_id: id },
            select: { emoji: true, felhasznalo_id: true }
        });
        res.json(updated);
    } catch (error) { next(error); }
});

export default router;
