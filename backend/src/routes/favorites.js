import express from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import { authenticate } from "./auth.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/favorites:
 *   post:
 *     summary: Add a product to favorites
 *     tags: [Favorites]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [termek_id]
 *             properties:
 *               termek_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Favorite added
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { termek_id } = req.body;
    const felhasznalo_id = req.user.userId;

    if (!termek_id) {
      return res.status(400).json({ error: "termek_id is required" });
    }

    const existing = await prisma.kedvencek.findUnique({
      where: {
        unique_kedvenc: { felhasznalo_id, termek_id },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "Product is already a favorite" });
    }

    const favorite = await prisma.kedvencek.create({
      data: {
        felhasznalo_id,
        termek_id,
      },
    });

    res.status(201).json(favorite);
  } catch (error) {
    console.error("Error creating favorite:", error);
    res.status(500).json({ error: "Failed to add favorite" });
  }
});

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Get all favorites for the logged-in user
 *     tags: [Favorites]
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const felhasznalo_id = req.user.userId;
    const favorites = await prisma.kedvencek.findMany({
      where: { felhasznalo_id },
      include: {
        Termek: {
          include: {
            Szerzok: true
          }
        },
      },
    });
    res.json(favorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

/**
 * @swagger
 * /api/favorites/{id}:
 *   delete:
 *     summary: Delete a favorite by ID
 *     tags: [Favorites]
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const felhasznalo_id = req.user.userId;
    const kedvencek_id = parseInt(req.params.id);

    const favorite = await prisma.kedvencek.findUnique({
      where: { kedvencek_id },
    });

    if (!favorite) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    if (favorite.felhasznalo_id !== felhasznalo_id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.kedvencek.delete({
      where: { kedvencek_id },
    });

    res.json({ message: "Favorite deleted successfully" });
  } catch (error) {
    console.error("Error deleting favorite:", error);
    res.status(500).json({ error: "Failed to delete favorite" });
  }
});

/**
 * @swagger
 * /api/favorites/{id}:
 *   get:
 *     summary: Get a favorite by ID
 *     tags: [Favorites]
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const felhasznalo_id = req.user.userId;
    const kedvencek_id = parseInt(req.params.id);

    const favorite = await prisma.kedvencek.findUnique({
      where: { kedvencek_id },
      include: {
        Termek: {
          include: {
            Szerzok: true
          }
        },
      },
    });

    if (!favorite) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    if (favorite.felhasznalo_id !== felhasznalo_id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(favorite);
  } catch (error) {
    console.error("Error fetching favorite:", error);
    res.status(500).json({ error: "Failed to fetch favorite" });
  }
});

export default router;
