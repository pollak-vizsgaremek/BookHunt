import express from "express";
import { PrismaClient } from "../../generated/prisma/index.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/webshop:
 *   post:
 *     summary: Manually add a webshop
 *     tags: [Webshops]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url, nev]
 *             properties:
 *               url:
 *                 type: string
 *               nev:
 *                 type: string
 *                 description: Name of the webshop
 *     responses:
 *       201:
 *         description: Webshop added successfully
 *       500:
 *         description: Webshop creation failed
 */
router.post("/webshop", async (req, res) => {
  try {
    const { url, nev } = req.body;

    const webshop = await prisma.webAruhaz.create({
      data: {
        url,
        nev,
      },
    });

    res.status(201).json({
      message: "Webshop added successfully",
      webshop: {
        id: webshop.webaruhaz_id,
        url: webshop.url,
        nev: webshop.nev,
      },
    });
  } catch (error) {
    console.error("Webshop creation error:", error);
    res.status(500).json({ error: "Webshop creation failed" });
  }
});

/**
 * @swagger
 * /api/webshops:
 *   get:
 *     summary: Get all webshops
 *     tags: [Webshops]
 *     responses:
 *       200:
 *         description: List of all webshops
 *       500:
 *         description: Failed to fetch webshops
 */
router.get("/webshops", async (req, res) => {
  try {
    const webshops = await prisma.webAruhaz.findMany({
      select: {
        webaruhaz_id: true,
        url: true,
        nev: true,
      },
    });
    res.json(webshops);
  } catch (error) {
    console.error("Error fetching webshops:", error);
    res.status(500).json({ error: "Failed to fetch webshops" });
  }
});

export default router;
