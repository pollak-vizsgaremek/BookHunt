import express from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import { authenticate } from "./auth.js"; // Optional depending on requirements

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/prices
router.post("/", async (req, res) => {
  try {
    const { kedvencek_id, webaruhaz_id, last_known_price } = req.body;

    if (!kedvencek_id || !webaruhaz_id || last_known_price === undefined) {
      return res.status(400).json({
        error: "kedvencek_id, webaruhaz_id, and last_known_price are required",
      });
    }

    const price = await prisma.arak.create({
      data: {
        kedvencek_id,
        webaruhaz_id,
        last_known_price,
      },
    });

    res.status(201).json(price);
  } catch (error) {
    console.error("Error creating price:", error);
    res.status(500).json({ error: "Failed to create price" });
  }
});

// GET /api/prices
router.get("/", async (req, res) => {
  try {
    const prices = await prisma.arak.findMany({
      include: {
        Kedvencek: true,
        WebAruhaz: true,
      },
    });
    res.json(prices);
  } catch (error) {
    console.error("Error fetching prices:", error);
    res.status(500).json({ error: "Failed to fetch prices" });
  }
});

// DELETE /api/prices/:id
router.delete("/:id", async (req, res) => {
  try {
    const arak_id = parseInt(req.params.id);

    await prisma.arak.delete({
      where: { arak_id },
    });

    res.json({ message: "Price deleted successfully" });
  } catch (error) {
    console.error("Error deleting price:", error);
    res.status(500).json({ error: "Failed to delete price" });
  }
});

// GET /api/prices/:id
router.get("/:id", async (req, res) => {
  try {
    const arak_id = parseInt(req.params.id);

    const price = await prisma.arak.findUnique({
      where: { arak_id },
      include: {
        Kedvencek: true,
        WebAruhaz: true,
      },
    });

    if (!price) {
      return res.status(404).json({ error: "Price not found" });
    }

    res.json(price);
  } catch (error) {
    console.error("Error fetching price:", error);
    res.status(500).json({ error: "Failed to fetch price" });
  }
});

export default router;
