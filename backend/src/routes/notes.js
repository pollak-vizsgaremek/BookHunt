import express from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import { authenticate } from "./auth.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/notes:
 *   post:
 *     summary: Create a new note (product-webshop link)
 *     tags: [Notes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [termek_id, webaruhaz_id]
 *             properties:
 *               termek_id:
 *                 type: integer
 *               webaruhaz_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Note created
 *       400:
 *         description: Missing fields or note already exists
 *       500:
 *         description: Failed to create note
 */
router.post("/", async (req, res) => {
  try {
    const { termek_id, webaruhaz_id } = req.body;

    if (!termek_id || !webaruhaz_id) {
      return res
        .status(400)
        .json({ error: "termek_id and webaruhaz_id are required" });
    }

    const existing = await prisma.feljegyzes.findUnique({
      where: {
        unique_feljegyzes: { termek_id, webaruhaz_id },
      },
    });

    if (existing) {
      return res
        .status(400)
        .json({ error: "Note already exists for this product and webshop" });
    }

    const note = await prisma.feljegyzes.create({
      data: {
        termek_id,
        webaruhaz_id,
      },
    });

    res.status(201).json(note);
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ error: "Failed to create note" });
  }
});

/**
 * @swagger
 * /api/notes:
 *   get:
 *     summary: Get all notes
 *     tags: [Notes]
 *     responses:
 *       200:
 *         description: List of all notes
 *       500:
 *         description: Failed to fetch notes
 */
router.get("/", async (req, res) => {
  try {
    const notes = await prisma.feljegyzes.findMany({
      include: {
        Termek: {
          include: {
            Szerzok: true
          }
        },
        WebAruhaz: true,
      },
    });
    res.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

/**
 * @swagger
 * /api/notes/{id}:
 *   put:
 *     summary: Update a note by ID
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               termek_id:
 *                 type: integer
 *               webaruhaz_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Note updated
 *       500:
 *         description: Failed to update note
 */
router.put("/:id", async (req, res) => {
  try {
    const feljegyzes_id = parseInt(req.params.id);
    const { termek_id, webaruhaz_id } = req.body;

    const note = await prisma.feljegyzes.update({
      where: { feljegyzes_id },
      data: {
        ...(termek_id && { termek_id }),
        ...(webaruhaz_id && { webaruhaz_id }),
      },
    });

    res.json(note);
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ error: "Failed to update note" });
  }
});

/**
 * @swagger
 * /api/notes/{id}:
 *   delete:
 *     summary: Delete a note by ID
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Note deleted
 *       500:
 *         description: Failed to delete note
 */
router.delete("/:id", async (req, res) => {
  try {
    const feljegyzes_id = parseInt(req.params.id);

    await prisma.feljegyzes.delete({
      where: { feljegyzes_id },
    });

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

/**
 * @swagger
 * /api/notes/{id}:
 *   get:
 *     summary: Get a note by ID
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Note found
 *       404:
 *         description: Note not found
 *       500:
 *         description: Failed to fetch note
 */
router.get("/:id", async (req, res) => {
  try {
    const feljegyzes_id = parseInt(req.params.id);

    const note = await prisma.feljegyzes.findUnique({
      where: { feljegyzes_id },
      include: {
        Termek: {
          include: {
            Szerzok: true
          }
        },
        WebAruhaz: true,
      },
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json(note);
  } catch (error) {
    console.error("Error fetching note:", error);
    res.status(500).json({ error: "Failed to fetch note" });
  }
});

export default router;
