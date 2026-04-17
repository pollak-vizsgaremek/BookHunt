import express from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/admin/users - List all users
router.get("/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.felhasznalo.findMany({
      select: {
        felhasznalo_id: true,
        felhasznalonev: true,
        email: true,
        profilkep: true,
        szerepkor: true,
        tiltva_eddig: true,
        tiltas_oka: true,
      },
      orderBy: { felhasznalo_id: "desc" },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete("/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (id === req.user.userId) {
      return res.status(400).json({ error: "You cannot delete yourself!" });
    }
    await prisma.felhasznalo.delete({ where: { felhasznalo_id: id } });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// POST /api/admin/users/:id/ban - Ban user
router.post("/users/:id/ban", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { days, hours, minutes, reason } = req.body;

    if (id === req.user.userId) {
      return res.status(400).json({ error: "You cannot ban yourself!" });
    }

    const banDate = new Date();
    banDate.setDate(banDate.getDate() + (parseInt(days) || 0));
    banDate.setHours(banDate.getHours() + (parseInt(hours) || 0));
    banDate.setMinutes(banDate.getMinutes() + (parseInt(minutes) || 0));

    await prisma.felhasznalo.update({
      where: { felhasznalo_id: id },
      data: {
        tiltva_eddig: banDate,
        tiltas_oka: reason || "No reason provided",
      },
    });

    res.json({ message: "User banned until " + banDate.toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Failed to ban user" });
  }
});

// POST /api/admin/users/message - Send message to specific or all users
router.post("/users/message", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, message, broadcast } = req.body;

    if (broadcast) {
      const allUsers = await prisma.felhasznalo.findMany({ select: { felhasznalo_id: true } });
      await prisma.ertesites.createMany({
        data: allUsers.map(u => ({
          felhasznalo_id: u.felhasznalo_id,
          szoveg: "ADMIN: " + message,
        })),
      });
    } else {
      await prisma.ertesites.create({
        data: {
          felhasznalo_id: parseInt(userId),
          szoveg: "ADMIN: " + message,
        },
      });
    }

    res.json({ message: "Message sent successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
