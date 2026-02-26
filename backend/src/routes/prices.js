import express from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import { authenticate } from "./auth.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/prices:
 *   post:
 *     summary: Create a price record
 *     tags: [Prices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [kedvencek_id, webaruhaz_id, last_known_price]
 *             properties:
 *               kedvencek_id:
 *                 type: integer
 *               webaruhaz_id:
 *                 type: integer
 *               last_known_price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Price created
 *       400:
 *         description: Missing fields
 *       500:
 *         description: Failed to create price
 */
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

/**
 * @swagger
 * /api/prices:
 *   get:
 *     summary: Get all prices
 *     tags: [Prices]
 *     responses:
 *       200:
 *         description: List of all prices
 *       500:
 *         description: Failed to fetch prices
 */
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

/**
 * @swagger
 * /api/prices/{id}:
 *   delete:
 *     summary: Delete a price by ID
 *     tags: [Prices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Price deleted
 *       500:
 *         description: Failed to delete price
 */
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

/**
 * @swagger
 * /api/prices/{id}:
 *   get:
 *     summary: Get a price by ID
 *     tags: [Prices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Price found
 *       404:
 *         description: Price not found
 *       500:
 *         description: Failed to fetch price
 */
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
