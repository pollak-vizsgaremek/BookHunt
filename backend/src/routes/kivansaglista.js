import express from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import { authenticate } from "./auth.js";
import { authenticatedReadLimiter, authenticatedLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();
const prisma = new PrismaClient();

// Add a book to wishlist
router.post("/", authenticatedLimiter, authenticate, async (req, res) => {
  try {
    const { konyv_id, cim, szerzo, boritokep_url, isbn, utolso_ismert_ar } = req.body;
    const felhasznalo_id = req.user.userId;

    if (!konyv_id || !cim) {
      return res.status(400).json({ error: "konyv_id and cim are required" });
    }

    const existing = await prisma.kivansaglista.findUnique({
      where: {
        unique_wishlist: { felhasznalo_id, konyv_id },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "Book is already in wishlist" });
    }

    const wishlistItem = await prisma.kivansaglista.create({
      data: {
        felhasznalo_id,
        konyv_id,
        cim,
        szerzo,
        boritokep_url,
        isbn: isbn || null,
        utolso_ismert_ar: utolso_ismert_ar ? parseFloat(utolso_ismert_ar) : null,
      },
    });

    res.status(201).json(wishlistItem);
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ error: "Failed to add to wishlist", details: error.message });
  }
});

// Get all wishlisted books for user
router.get("/", authenticatedReadLimiter, authenticate, async (req, res) => {
  try {
    const felhasznalo_id = req.user.userId;
    const items = await prisma.kivansaglista.findMany({
      where: { felhasznalo_id },
      orderBy: { letrehozva: 'desc' }
    });
    res.json(items);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
});

// Remove a book from wishlist
router.delete("/:bookId", authenticatedLimiter, authenticate, async (req, res) => {
  try {
    const felhasznalo_id = req.user.userId;
    const konyv_id = req.params.bookId;

    const existing = await prisma.kivansaglista.findUnique({
      where: {
        unique_wishlist: { felhasznalo_id, konyv_id },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Book not found in wishlist" });
    }

    await prisma.kivansaglista.delete({
      where: {
        unique_wishlist: { felhasznalo_id, konyv_id },
      },
    });

    res.json({ message: "Book removed from wishlist" });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ error: "Failed to remove from wishlist" });
  }
});

export default router;
