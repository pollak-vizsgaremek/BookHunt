import express from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import { authenticate } from "./auth.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Submit a review for a product
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [termek_id, csillag]
 *             properties:
 *               termek_id:
 *                 type: integer
 *                 description: Product ID
 *               csillag:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Star rating (1–5)
 *               szoveg:
 *                 type: string
 *                 description: Optional review text
 *     responses:
 *       201:
 *         description: Review submitted
 *       400:
 *         description: Missing fields, invalid rating, or already reviewed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to submit review
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { termek_id, csillag, szoveg } = req.body;
    const felhasznalo_id = req.user.userId;

    if (!termek_id || csillag === undefined) {
      return res
        .status(400)
        .json({ error: "termek_id and csillag are required" });
    }

    if (csillag < 1 || csillag > 5 || !Number.isInteger(csillag)) {
      return res
        .status(400)
        .json({ error: "csillag must be an integer between 1 and 5" });
    }

    const existing = await prisma.velemeny.findUnique({
      where: { unique_velemeny: { felhasznalo_id, termek_id } },
    });

    if (existing) {
      return res
        .status(400)
        .json({ error: "You have already reviewed this product" });
    }

    const review = await prisma.velemeny.create({
      data: { felhasznalo_id, termek_id, csillag, szoveg },
      include: { Felhasznalo: { select: { felhasznalonev: true } } },
    });

    res.status(201).json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

/**
 * @swagger
 * /api/reviews/product/{product_id}:
 *   get:
 *     summary: Get all reviews for a product (with average star rating)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of reviews and average rating
 *       500:
 *         description: Failed to fetch reviews
 */
router.get("/product/:product_id", async (req, res) => {
  try {
    const termek_id = parseInt(req.params.product_id);

    const reviews = await prisma.velemeny.findMany({
      where: { termek_id },
      include: {
        Felhasznalo: { select: { felhasznalonev: true } },
      },
      orderBy: { datum: "desc" },
    });

    const averageRating = reviews.length
      ? reviews.reduce((sum, r) => sum + r.csillag, 0) / reviews.length
      : null;

    res.json({
      product_id: termek_id,
      average_rating: averageRating
        ? parseFloat(averageRating.toFixed(2))
        : null,
      review_count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Update your own review
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
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
 *               csillag:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               szoveg:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated
 *       400:
 *         description: Invalid rating
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Review not found
 *       500:
 *         description: Failed to update review
 */
router.put("/:id", authenticate, async (req, res) => {
  try {
    const velemeny_id = parseInt(req.params.id);
    const felhasznalo_id = req.user.userId;
    const { csillag, szoveg } = req.body;

    if (
      csillag !== undefined &&
      (csillag < 1 || csillag > 5 || !Number.isInteger(csillag))
    ) {
      return res
        .status(400)
        .json({ error: "csillag must be an integer between 1 and 5" });
    }

    const existing = await prisma.velemeny.findUnique({
      where: { velemeny_id },
    });
    if (!existing) return res.status(404).json({ error: "Review not found" });
    if (existing.felhasznalo_id !== felhasznalo_id)
      return res.status(403).json({ error: "Unauthorized" });

    const updated = await prisma.velemeny.update({
      where: { velemeny_id },
      data: {
        ...(csillag !== undefined && { csillag }),
        ...(szoveg !== undefined && { szoveg }),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ error: "Failed to update review" });
  }
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete your own review
 *     tags: [Reviews]
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
 *         description: Review deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Review not found
 *       500:
 *         description: Failed to delete review
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const velemeny_id = parseInt(req.params.id);
    const felhasznalo_id = req.user.userId;

    const existing = await prisma.velemeny.findUnique({
      where: { velemeny_id },
    });
    if (!existing) return res.status(404).json({ error: "Review not found" });
    if (existing.felhasznalo_id !== felhasznalo_id)
      return res.status(403).json({ error: "Unauthorized" });

    await prisma.velemeny.delete({ where: { velemeny_id } });

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

export default router;
