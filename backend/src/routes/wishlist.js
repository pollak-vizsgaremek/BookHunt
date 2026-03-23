import express from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import { authenticate } from "./auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// Add a book to wishlist
router.post("/", authenticate, async (req, res) => {
  try {
    const { bookId, title, author, coverUrl } = req.body;
    const felhasznalo_id = req.user.userId;

    if (!bookId || !title) {
      return res.status(400).json({ error: "bookId and title are required" });
    }

    const existing = await prisma.wishlist.findUnique({
      where: {
        unique_wishlist: { felhasznalo_id, book_id: bookId },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "Book is already in wishlist" });
    }

    const wishlistItem = await prisma.wishlist.create({
      data: {
        felhasznalo_id,
        book_id: bookId,
        title,
        author,
        coverUrl,
      },
    });

    res.status(201).json(wishlistItem);
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ error: "Failed to add to wishlist" });
  }
});

// Get all wishlisted books for user
router.get("/", authenticate, async (req, res) => {
  try {
    const felhasznalo_id = req.user.userId;
    const items = await prisma.wishlist.findMany({
      where: { felhasznalo_id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(items);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
});

// Remove a book from wishlist
router.delete("/:bookId", authenticate, async (req, res) => {
  try {
    const felhasznalo_id = req.user.userId;
    const book_id = req.params.bookId;

    const existing = await prisma.wishlist.findUnique({
      where: {
        unique_wishlist: { felhasznalo_id, book_id },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Book not found in wishlist" });
    }

    await prisma.wishlist.delete({
      where: {
        unique_wishlist: { felhasznalo_id, book_id },
      },
    });

    res.json({ message: "Book removed from wishlist" });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ error: "Failed to remove from wishlist" });
  }
});

export default router;
