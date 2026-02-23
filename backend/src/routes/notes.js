import express from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import { authenticate } from "./auth.js"; // Optional: if notes should be authenticated later

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/notes
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

// GET /api/notes
router.get("/", async (req, res) => {
  try {
    const notes = await prisma.feljegyzes.findMany({
      include: {
        Termek: true,
        WebAruhaz: true,
      },
    });
    res.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// PUT /api/notes/:id
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

// DELETE /api/notes/:id
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

// GET /api/notes/:id
router.get("/:id", async (req, res) => {
  try {
    const feljegyzes_id = parseInt(req.params.id);

    const note = await prisma.feljegyzes.findUnique({
      where: { feljegyzes_id },
      include: {
        Termek: true,
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
