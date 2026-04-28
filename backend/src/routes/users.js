import express from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { PrismaClient } from "../../generated/prisma/index.js";
import { authenticate } from "./auth.js";
import { authenticatedReadLimiter } from "../middleware/rateLimiter.js";
import { isForbiddenUsername } from "../utils/censor.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "pfp-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error("Only images (jpeg, jpg, png, webp) are allowed"));
  }
});

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
router.get("/", authenticatedReadLimiter, authenticate, async (req, res) => {
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

// Update Profile
router.put("/profile", authenticatedReadLimiter, authenticate, async (req, res) => {
  try {
    const { username, email } = req.body;
    const userId = req.user.userId;

    if (!username || !email) {
      return res.status(400).json({ error: "Username and email are required" });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: "Username must be between 3 and 30 characters" });
    }

    if (!/^[\p{L}\p{N}_ ]+$/u.test(username)) {
      return res.status(400).json({ error: "Username can only contain letters, numbers, underscores, and spaces" });
    }

    if (await isForbiddenUsername(username)) {
      return res.status(400).json({ error: "This username is not allowed." });
    }

    const atIndex = email.indexOf('@');
    const isValidEmail =
      email.length <= 254 &&
      atIndex > 0 &&
      atIndex === email.lastIndexOf('@') &&
      email.indexOf('.', atIndex + 1) > atIndex + 1 &&
      !email.includes(' ') &&
      !email.startsWith('.') &&
      !email.endsWith('.');
    if (!isValidEmail) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    const existingUser = await prisma.felhasznalo.findFirst({
      where: {
        felhasznalonev: username,
        NOT: { felhasznalo_id: userId }
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const existingEmail = await prisma.felhasznalo.findFirst({
      where: {
        email: email,
        NOT: { felhasznalo_id: userId }
      }
    });

    if (existingEmail) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const updatedUser = await prisma.felhasznalo.update({
      where: { felhasznalo_id: userId },
      data: {
        felhasznalonev: username,
        email: email
      },
      select: {
        felhasznalo_id: true,
        felhasznalonev: true,
        email: true,
        profilkep: true,
        szerepkor: true
      }
    });

    res.json({
      id: updatedUser.felhasznalo_id,
      username: updatedUser.felhasznalonev,
      email: updatedUser.email,
      profilkep: updatedUser.profilkep,
      szerepkor: updatedUser.szerepkor
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Update Password
router.put("/password", authenticatedReadLimiter, authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both current and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    if (Buffer.byteLength(newPassword, 'utf8') > 72) {
      return res.status(400).json({ error: "New password must be 72 characters or fewer" });
    }

    const user = await prisma.felhasznalo.findUnique({
      where: { felhasznalo_id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // if user signed in via google only, they might not have a strong standard password, 
    // but they shouldn't hit this logic block successfully if they don't know the password.
    const validPassword = await bcrypt.compare(currentPassword, user.jelszo);
    if (!validPassword) {
      return res.status(400).json({ error: "Incorrect current password" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.felhasznalo.update({
      where: { felhasznalo_id: userId },
      data: {
        jelszo: hashedNewPassword
      }
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ error: "Failed to update password" });
  }
});

// Update Profile Picture
router.patch("/profile-picture", authenticatedReadLimiter, authenticate, upload.single("profilePicture"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const userId = req.user.userId;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const user = await prisma.felhasznalo.findUnique({ where: { felhasznalo_id: userId } });
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    // --- Rate Limit Check (2x per day) ---
    let counter = user.pfp_modositas_szamlalo || 0;
    const lastUpdate = user.utolso_pfp_modositas;

    if (lastUpdate) {
        const lastUpdateDate = new Date(lastUpdate.getFullYear(), lastUpdate.getMonth(), lastUpdate.getDate());
        if (lastUpdateDate.getTime() === today.getTime()) {
            if (counter >= 2) {
                // Delete the uploaded file since we are rejecting
                const newPath = path.join(process.cwd(), 'src', 'uploads', req.file.filename);
                if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
                
                return res.status(429).json({ 
                    error: "Daily limit reached", 
                    message: "You can only change your profile picture 2 times per day. Please try again tomorrow!" 
                });
            }
        } else {
            counter = 0; // Reset for new day
        }
    } else {
        counter = 0;
    }

    const profilePictureUrl = `/uploads/${req.file.filename}`;

    // Delete old local profile picture if it exists
    if (user.profilkep && user.profilkep.includes('/uploads/')) {
        try {
            const oldFilename = user.profilkep.split('/').pop();
            const oldPath = path.join(process.cwd(), 'src', 'uploads', oldFilename);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        } catch (err) {
            console.warn("Failed to delete old profile picture:", err);
        }
    }

    await prisma.felhasznalo.update({
      where: { felhasznalo_id: userId },
      data: { 
        profilkep: profilePictureUrl,
        pfp_modositas_szamlalo: counter + 1,
        utolso_pfp_modositas: now
      },
    });

    res.json({ 
      message: "Profile picture updated successfully",
      profilkep: profilePictureUrl 
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ error: "Failed to update profile picture" });
  }
});

export default router;
