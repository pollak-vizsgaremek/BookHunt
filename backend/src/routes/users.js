import express from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import { authenticate } from "./auth.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (requires authentication)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch users
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const users = await prisma.felhasznalo.findMany({
      select: {
        felhasznalo_id: true,
        email: true,
        felhasznalonev: true,
      },
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
