import express from "express";
import { PrismaClient } from "../../generated/prisma/index.js";

const router = express.Router();
const prisma = new PrismaClient();

// get price history
router.get("/", async (req, res) => {
  try {
    const priceHistory = await prisma.ar_Tortenet.findMany({
      select: {
        ar_id: true,
        feljegyzes_id: true,
        ar: true,
        datum: true,
      },
    });
    res.json(priceHistory);
  } catch (error) {
    console.error("Error fetching price history:", error);
    res.status(500).json({ error: "Failed to fetch price history" });
  }
});
// POST /api/price-history
router.post("/", async (req, res) => {
  try {
    const { feljegyzes_id, ar } = req.body;

    if (!feljegyzes_id || ar === undefined) {
      return res
        .status(400)
        .json({ error: "feljegyzes_id and ar are required" });
    }

    const priceHistoryItem = await prisma.ar_Tortenet.create({
      data: {
        feljegyzes_id,
        ar,
      },
    });

    res.status(201).json(priceHistoryItem);
  } catch (error) {
    console.error("Error creating price history:", error);
    res.status(500).json({ error: "Failed to create price history record" });
  }
});

// DELETE /api/price-history/:id
router.delete("/:id", async (req, res) => {
  try {
    const ar_id = parseInt(req.params.id);

    await prisma.ar_Tortenet.delete({
      where: { ar_id },
    });

    res.json({ message: "Price history record deleted successfully" });
  } catch (error) {
    console.error("Error deleting price history:", error);
    res.status(500).json({ error: "Failed to delete price history record" });
  }
});

// GET /api/price-history/:id
router.get("/:id", async (req, res) => {
  try {
    const ar_id = parseInt(req.params.id);

    const priceHistoryItem = await prisma.ar_Tortenet.findUnique({
      where: { ar_id },
      select: {
        ar_id: true,
        feljegyzes_id: true,
        ar: true,
        datum: true,
      },
    });

    if (!priceHistoryItem) {
      return res.status(404).json({ error: "Price history record not found" });
    }

    res.json(priceHistoryItem);
  } catch (error) {
    console.error("Error fetching price history item:", error);
    res.status(500).json({ error: "Failed to fetch price history record" });
  }
});

export default router;
