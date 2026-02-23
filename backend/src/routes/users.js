import express from "express";
import { PrismaClient } from "../../generated/prisma/index.js";

const router = express.Router();
const prisma = new PrismaClient();

// get all users
router.get("/", async (req, res) => {
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
