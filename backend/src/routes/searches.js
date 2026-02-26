import express from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import { authenticate } from "./auth.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/searches:
 *   post:
 *     summary: Create a new search record
 *     tags: [Searches]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [webaruhaz_id]
 *             properties:
 *               webaruhaz_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Search created
 *       400:
 *         description: Missing webaruhaz_id
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to add search
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { webaruhaz_id } = req.body;
    const felhasznalo_id = req.user.userId;

    if (!webaruhaz_id) {
      return res.status(400).json({ error: "webaruhaz_id is required" });
    }

    const search = await prisma.keres.create({
      data: {
        felhasznalo_id,
        webaruhaz_id,
      },
    });

    res.status(201).json(search);
  } catch (error) {
    console.error("Error creating search:", error);
    res.status(500).json({ error: "Failed to add search" });
  }
});

/**
 * @swagger
 * /api/searches:
 *   get:
 *     summary: Get all searches for the logged-in user
 *     tags: [Searches]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of searches
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch searches
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const felhasznalo_id = req.user.userId;
    const searches = await prisma.keres.findMany({
      where: { felhasznalo_id },
      include: {
        WebAruhaz: true,
      },
    });
    res.json(searches);
  } catch (error) {
    console.error("Error fetching searches:", error);
    res.status(500).json({ error: "Failed to fetch searches" });
  }
});

/**
 * @swagger
 * /api/searches/{id}:
 *   delete:
 *     summary: Delete a search by ID
 *     tags: [Searches]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Search deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Search not found
 *       500:
 *         description: Failed to delete search
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const felhasznalo_id = req.user.userId;
    const keres_id = parseInt(req.params.id);

    const search = await prisma.keres.findUnique({
      where: { keres_id },
    });

    if (!search) {
      return res.status(404).json({ error: "Search not found" });
    }

    if (search.felhasznalo_id !== felhasznalo_id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.keres.delete({
      where: { keres_id },
    });

    res.json({ message: "Search deleted successfully" });
  } catch (error) {
    console.error("Error deleting search:", error);
    res.status(500).json({ error: "Failed to delete search" });
  }
});

/**
 * @swagger
 * /api/searches/{id}:
 *   get:
 *     summary: Get a search by ID
 *     tags: [Searches]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Search found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Search not found
 *       500:
 *         description: Failed to fetch search
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const felhasznalo_id = req.user.userId;
    const keres_id = parseInt(req.params.id);

    const search = await prisma.keres.findUnique({
      where: { keres_id },
      include: {
        WebAruhaz: true,
      },
    });

    if (!search) {
      return res.status(404).json({ error: "Search not found" });
    }

    if (search.felhasznalo_id !== felhasznalo_id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(search);
  } catch (error) {
    console.error("Error fetching search:", error);
    res.status(500).json({ error: "Failed to fetch search" });
  }
});

export default router;
