/**
 * adminRoutes.js
 *
 * Admin-only API végpontok.
 * MINDEN végpont kétszeres middleware-el védett:
 *   1. authenticate — érvényes JWT token szükséges
 *   2. requireAdmin — ADMIN szerepkör szükséges
 *
 * Végpontok:
 *   GET    /api/admin/users              — összes felhasználó (jelszo nélkül)
 *   GET    /api/admin/users/:id          — egy felhasználó adatai
 *   PATCH  /api/admin/users/:id/role     — szerepkör módosítása
 *   DELETE /api/admin/users/:id          — felhasználó törlése
 *
 *   GET    /api/admin/reviews            — összes értékelés (szűrőkkel)
 *   DELETE /api/admin/reviews/:id        — értékelés törlése (moderálás)
 *
 *   GET    /api/admin/products           — összes termék (paginated)
 *   DELETE /api/admin/products/:id       — termék törlése
 *
 *   GET    /api/admin/stats              — összesített statisztikák
 */

import express from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import { authenticate } from "./auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = express.Router();
const prisma = new PrismaClient();

// Dupla middleware shorthand — minden route-ra alkalmazzuk
const adminGuard = [authenticate, requireAdmin];

// ============================================================
// FELHASZNÁLÓK
// ============================================================

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Paginated list of users (password excluded)
 *       403:
 *         description: Forbidden
 */
router.get("/users", ...adminGuard, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.felhasznalo.findMany({
        skip,
        take: limit,
        orderBy: { felhasznalo_id: "asc" },
        select: {
          felhasznalo_id: true,
          felhasznalonev: true,
          email: true,
          szerepkor: true,
          profilkep: true,
          tiltva_eddig: true,
          tiltas_oka: true,
        },
      }),
      prisma.felhasznalo.count(),
    ]);

    res.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      users,
    });
  } catch (error) {
    console.error("[Admin] Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}/ban:
 *   post:
 *     summary: Ban a user for a specific duration (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 */
router.post("/users/:id/ban", ...adminGuard, async (req, res) => {
  try {
    const felhasznalo_id = parseInt(req.params.id);
    const { days, hours, minutes, reason } = req.body;

    if (isNaN(felhasznalo_id)) return res.status(400).json({ error: "Invalid user ID" });
    if (felhasznalo_id === req.user.userId) return res.status(400).json({ error: "You cannot ban yourself" });

    // Check if target is an admin
    const targetUser = await prisma.felhasznalo.findUnique({ where: { felhasznalo_id }, select: { szerepkor: true } });
    if (targetUser?.szerepkor === 'ADMIN') {
      return res.status(400).json({ error: "Administrator accounts cannot be banned." });
    }

    const banUntil = new Date();
    banUntil.setDate(banUntil.getDate() + (parseInt(days) || 0));
    banUntil.setHours(banUntil.getHours() + (parseInt(hours) || 0));
    banUntil.setMinutes(banUntil.getMinutes() + (parseInt(minutes) || 0));

    const updated = await prisma.felhasznalo.update({
      where: { felhasznalo_id },
      data: {
        tiltva_eddig: banUntil,
        tiltas_oka: reason || "No reason provided",
      },
    });

    res.json({ message: "User banned successfully", until: banUntil, user: updated });
  } catch (error) {
    console.error("[Admin] Ban error:", error);
    res.status(500).json({ error: "Failed to ban user" });
  }
});

/**
 * @swagger
 * /api/admin/users/message:
 *   post:
 *     summary: Send a message to a user or all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 */
router.post("/users/message", ...adminGuard, async (req, res) => {
  try {
    const { userId, message, broadcast } = req.body;

    if (broadcast) {
      const users = await prisma.felhasznalo.findMany({ select: { felhasznalo_id: true } });
      await prisma.ertesites.createMany({
        data: users.map(u => ({
          felhasznalo_id: u.felhasznalo_id,
          szoveg: "ADMIN: " + message,
        })),
      });
    } else {
      if (!userId) return res.status(400).json({ error: "userId is required for individual messages" });
      await prisma.ertesites.create({
        data: {
          felhasznalo_id: parseInt(userId),
          szoveg: "ADMIN: " + message,
        },
      });
    }

    res.json({ message: "Message sent successfully" });
  } catch (error) {
    console.error("[Admin] Messaging error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get a single user by ID (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 */
router.get("/users/:id", ...adminGuard, async (req, res) => {
  try {
    const felhasznalo_id = parseInt(req.params.id);
    if (isNaN(felhasznalo_id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await prisma.felhasznalo.findUnique({
      where: { felhasznalo_id },
      select: {
        felhasznalo_id: true,
        felhasznalonev: true,
        email: true,
        szerepkor: true,
        _count: {
          select: {
            Velemenyek: true,
            Kedvencek: true,
            Kivansaglista: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("[Admin] Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   patch:
 *     summary: Change a user's role (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [szerepkor]
 *             properties:
 *               szerepkor:
 *                 type: string
 *                 enum: [USER, ADMIN]
 */
router.patch("/users/:id/role", ...adminGuard, async (req, res) => {
  try {
    const felhasznalo_id = parseInt(req.params.id);
    if (isNaN(felhasznalo_id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { szerepkor } = req.body;
    if (!szerepkor || !["USER", "ADMIN"].includes(szerepkor)) {
      return res.status(400).json({ error: "szerepkor must be 'USER' or 'ADMIN'" });
    }

    // Ne lehessen saját magát lefokozni
    if (felhasznalo_id === req.user.userId) {
      return res.status(400).json({ error: "Administrators cannot change their own role" });
    }

    const updated = await prisma.felhasznalo.update({
      where: { felhasznalo_id },
      data: { szerepkor },
      select: {
        felhasznalo_id: true,
        felhasznalonev: true,
        email: true,
        szerepkor: true,
      },
    });

    res.json({ message: "Role updated successfully", user: updated });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    console.error("[Admin] Error updating role:", error);
    res.status(500).json({ error: "Failed to update role" });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 */
router.delete("/users/:id", ...adminGuard, async (req, res) => {
  try {
    const felhasznalo_id = parseInt(req.params.id);
    if (isNaN(felhasznalo_id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Biztonsági zár: admin nem törölheti önmagát vagy más admint
    if (felhasznalo_id === req.user.userId) {
      return res.status(400).json({ error: "Administrators cannot delete their own account" });
    }

    const targetUser = await prisma.felhasznalo.findUnique({ where: { felhasznalo_id }, select: { szerepkor: true } });
    if (targetUser?.szerepkor === 'ADMIN') {
      return res.status(400).json({ error: "Administrator accounts cannot be deleted." });
    }

    await prisma.felhasznalo.delete({ where: { felhasznalo_id } });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    console.error("[Admin] Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// ============================================================
// ÉRTÉKELÉSEK (MODERÁLÁS)
// ============================================================

/**
 * @swagger
 * /api/admin/reviews:
 *   get:
 *     summary: List all reviews with optional filters (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: min_csillag
 *         schema: { type: integer }
 *         description: Filter reviews with star rating <= this value (e.g. 1 = only 1-star)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 */
router.get("/reviews", ...adminGuard, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const where = {};
    if (req.query.max_csillag) {
      where.csillag = { lte: parseInt(req.query.max_csillag) };
    }

    const [reviews, total] = await Promise.all([
      prisma.velemeny.findMany({
        where,
        skip,
        take: limit,
        orderBy: { datum: "desc" },
        include: {
          Felhasznalo: { select: { felhasznalonev: true, email: true } },
          Termek: { select: { cim: true, termek_id: true } },
        },
      }),
      prisma.velemeny.count({ where }),
    ]);

    res.json({ total, page, limit, totalPages: Math.ceil(total / limit), reviews });
  } catch (error) {
    console.error("[Admin] Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

/**
 * @swagger
 * /api/admin/reviews/{id}:
 *   delete:
 *     summary: Delete a review (moderation - Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 */
router.delete("/reviews/:id", ...adminGuard, async (req, res) => {
  try {
    const velemeny_id = parseInt(req.params.id);
    if (isNaN(velemeny_id)) {
      return res.status(400).json({ error: "Invalid review ID" });
    }

    await prisma.velemeny.delete({ where: { velemeny_id } });

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Review not found" });
    }
    console.error("[Admin] Error deleting review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

// ============================================================
// TERMÉKEK
// ============================================================

/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     summary: List all products (paginated, Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 */
router.get("/products", ...adminGuard, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.termek.findMany({
        skip,
        take: limit,
        orderBy: { termek_id: "asc" },
        include: {
          Szerzok: { select: { nev: true } },
          _count: { select: { Velemenyek: true, Kedvencek: true } },
        },
      }),
      prisma.termek.count(),
    ]);

    res.json({ total, page, limit, totalPages: Math.ceil(total / limit), products });
  } catch (error) {
    console.error("[Admin] Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

/**
 * @swagger
 * /api/admin/products/{id}:
 *   delete:
 *     summary: Delete a product (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 */
router.delete("/products/:id", ...adminGuard, async (req, res) => {
  try {
    const termek_id = parseInt(req.params.id);
    if (isNaN(termek_id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    await prisma.termek.delete({ where: { termek_id } });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Product not found" });
    }
    console.error("[Admin] Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// ============================================================
// STATISZTIKÁK
// ============================================================

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get site-wide statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 */
router.get("/stats", ...adminGuard, async (req, res) => {
  try {
    const [
      userCount,
      productCount,
      reviewCount,
      adminCount,
      wishlistCount,
    ] = await Promise.all([
      prisma.felhasznalo.count(),
      prisma.termek.count(),
      prisma.velemeny.count(),
      prisma.felhasznalo.count({ where: { szerepkor: "ADMIN" } }),
      prisma.kivansaglista.count(),
    ]);

    res.json({
      users: { total: userCount, admins: adminCount, regular: userCount - adminCount },
      products: productCount,
      reviews: reviewCount,
      wishlistItems: wishlistCount,
    });
  } catch (error) {
    console.error("[Admin] Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
