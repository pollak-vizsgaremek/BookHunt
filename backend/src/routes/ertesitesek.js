import express from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import { authenticate } from "./auth.js";
import { authenticatedReadLimiter, authenticatedLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();
const prisma = new PrismaClient();

// Get all notifications for the authenticated user
router.get("/", authenticatedReadLimiter, authenticate, async (req, res) => {
  try {
    const felhasznalo_id = req.user.userId;
    const items = await prisma.ertesites.findMany({
      where: { felhasznalo_id },
      orderBy: { datum: 'desc' }
    });
    res.json(items);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark a notification as read
router.post("/:id/read", authenticatedLimiter, authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const felhasznalo_id = req.user.userId;

    const existing = await prisma.ertesites.findFirst({
      where: { ertesites_id: id, felhasznalo_id }
    });

    if (!existing) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const updated = await prisma.ertesites.update({
      where: { ertesites_id: id },
      data: { olvasott: true }
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

export default router;
