import express from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import { authenticate } from "./auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// Get all bookmarks for the authenticated user
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const bookmarks = await prisma.konyvjelzo.findMany({
      where: { felhasznalo_id: userId },
      orderBy: { frissitve: 'desc' }
    });
    res.json(bookmarks);
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    res.status(500).json({ error: "Failed to fetch bookmarks." });
  }
});

// Add a new bookmark
router.post("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { konyv_id, cim, szerzo, boritokep_url, oldalszam, max_oldalszam, idezet } = req.body;
    console.log("Creating bookmark for user:", userId, "Data:", req.body);

    if (!konyv_id || !cim) {
      return res.status(400).json({ error: "konyv_id and cim are required." });
    }

    // Check limit
    const count = await prisma.konyvjelzo.count({
      where: { felhasznalo_id: userId }
    });

    if (count >= 20) {
      return res.status(400).json({ error: "You can only have up to 20 bookmarks." });
    }

    // Check if already exists
    const existing = await prisma.konyvjelzo.findFirst({
      where: { felhasznalo_id: userId, konyv_id: konyv_id }
    });

    if (existing) {
      return res.status(400).json({ error: "This book is already in your bookmarks." });
    }

    const newBookmark = await prisma.konyvjelzo.create({
      data: {
        felhasznalo_id: userId,
        konyv_id,
        cim,
        szerzo,
        boritokep_url,
        oldalszam: oldalszam || 0,
        max_oldalszam: max_oldalszam || null,
        idezet: idezet || null
      }
    });

    res.status(201).json(newBookmark);
  } catch (error) {
    console.error("Error creating bookmark:", error);
    res.status(500).json({ error: "Failed to create bookmark.", details: error.message });
  }
});

// Update a bookmark (page number and quote)
router.put("/:id", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const bookmarkId = parseInt(req.params.id);
    const { oldalszam, idezet } = req.body;

    if (isNaN(bookmarkId)) {
      return res.status(400).json({ error: "Invalid bookmark ID." });
    }

    // Verify ownership
    const existing = await prisma.konyvjelzo.findUnique({
      where: { id: bookmarkId }
    });

    if (!existing || existing.felhasznalo_id !== userId) {
      return res.status(404).json({ error: "Bookmark not found." });
    }

    if (idezet && idezet.length > 255) {
        return res.status(400).json({ error: "Quote cannot exceed 255 characters." });
    }

    const updated = await prisma.konyvjelzo.update({
      where: { id: bookmarkId },
      data: {
        oldalszam: oldalszam !== undefined ? parseInt(oldalszam) : existing.oldalszam,
        idezet: idezet !== undefined ? idezet : existing.idezet
      }
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating bookmark:", error);
    res.status(500).json({ error: "Failed to update bookmark." });
  }
});

// Delete a bookmark
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const bookmarkId = parseInt(req.params.id);

    if (isNaN(bookmarkId)) {
      return res.status(400).json({ error: "Invalid bookmark ID." });
    }

    // Verify ownership
    const existing = await prisma.konyvjelzo.findUnique({
      where: { id: bookmarkId }
    });

    if (!existing || existing.felhasznalo_id !== userId) {
      return res.status(404).json({ error: "Bookmark not found." });
    }

    await prisma.konyvjelzo.delete({
      where: { id: bookmarkId }
    });

    res.json({ message: "Bookmark deleted successfully." });
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    res.status(500).json({ error: "Failed to delete bookmark." });
  }
});

export default router;
