import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../../generated/prisma/index.js";
import { OAuth2Client } from "google-auth-library";

const router = express.Router();
const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Auth API root info
/**
 * @swagger
 * /api/auth:
 *   get:
 *     summary: Auth API info
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Returns auth endpoint list as HTML
 */
router.get("/", (req, res) => {
  res.send(`
    <h1>Authentication API</h1>
    <p>Available endpoints:</p>
    <ul>
      <li><strong>POST</strong> /api/auth/register - Register a new user</li>
      <li><strong>POST</strong> /api/auth/login - Login user</li>
      <li><strong>GET</strong> /api/auth/me - Get current user (Requires token)</li>
    </ul>
    <p><a href="/">Go back to main API</a></p>
  `);
});

// Register
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, email]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully, returns JWT token
 *       400:
 *         description: Missing fields or username already taken
 *       500:
 *         description: Register failed
 */
router.post("/register", async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // --- Validáció ---
    if (!username || !password || !email) {
      return res
        .status(400)
        .json({ error: "Username, password and email are required" });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: "Username must be between 3 and 30 characters" });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: "Username can only contain letters, numbers, and underscores" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // bcrypt truncates at 72 bytes – warn if password is too long
    if (Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ error: "Password must be 72 characters or fewer" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }
    // --- Validáció vége ---

    const existingUser = await prisma.felhasznalo.findUnique({
      where: { felhasznalonev: username },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const existingEmail = await prisma.felhasznalo.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.felhasznalo.create({
      data: {
        felhasznalonev: username,
        jelszo: hashedPassword,
        email,
      },
    });

    // Create Token — szerepkor included so requireAdmin middleware doesn't need extra DB query
    const token = jwt.sign(
      { userId: user.felhasznalo_id, szerepkor: user.szerepkor },
      process.env.JWT_SECRET || "bookhunt_secret",
      { expiresIn: "7d" },
    );

    res.status(201).json({
      token,
      user: {
        id: user.felhasznalo_id,
        username: user.felhasznalonev,
        email: user.email,
        szerepkor: user.szerepkor,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    if (error.message && (error.message.includes("DATABASE_URL") || error.message.includes("Can't reach database server"))) {
      return res.status(503).json({ error: "Database connection failed. Please ensure your local database is running and DATABASE_URL is set in .env." });
    }
    res.status(500).json({ error: "Register failed", details: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const identifier = username || email;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ error: "Username/Email and password are required" });
    }

    const user = await prisma.felhasznalo.findFirst({
      where: {
        OR: [{ felhasznalonev: identifier }, { email: identifier }],
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.jelszo);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.felhasznalo_id, szerepkor: user.szerepkor },
      process.env.JWT_SECRET || "bookhunt_secret",
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        id: user.felhasznalo_id,
        username: user.felhasznalonev,
        email: user.email,
        szerepkor: user.szerepkor,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    if (error.message && (error.message.includes("DATABASE_URL") || error.message.includes("Can't reach database server"))) {
      return res.status(503).json({ error: "Database connection failed. Please ensure your local database is running and DATABASE_URL is set in .env." });
    }
    res.status(500).json({ error: "Login failed" });
  }
});

// Google Login / Register
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: "No credential provided" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ error: "Invalid Google token payload" });
    }

    const { email, name } = payload;
    if (!email) {
      return res.status(400).json({ error: "Email not provided by Google" });
    }

    let user = await prisma.felhasznalo.findUnique({
      where: { email },
    });

    if (!user) {
      // Create user
      const secureRandomString = Math.random().toString(36).slice(-10) + Date.now().toString();
      const randomPassword = await bcrypt.hash(secureRandomString, 10);
      let baseUsername = name ? name.replace(/\s+/g, "") : email.split("@")[0];
      let username = baseUsername;

      // Ensure unique username
      let usernameCounter = 1;
      let existingUser = await prisma.felhasznalo.findUnique({
        where: { felhasznalonev: username },
      });
      while (existingUser) {
        username = `${baseUsername}${usernameCounter}`;
        existingUser = await prisma.felhasznalo.findUnique({
          where: { felhasznalonev: username },
        });
        usernameCounter++;
      }

      user = await prisma.felhasznalo.create({
        data: {
          felhasznalonev: username,
          jelszo: randomPassword,
          email,
        },
      });
    }

    const token = jwt.sign(
      { userId: user.felhasznalo_id, szerepkor: user.szerepkor },
      process.env.JWT_SECRET || "bookhunt_secret",
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        id: user.felhasznalo_id,
        username: user.felhasznalonev,
        email: user.email,
        szerepkor: user.szerepkor,
      },
    });
  } catch (error) {
    console.error("Google Auth error:", error);
    if (error.message && (error.message.includes("DATABASE_URL") || error.message.includes("Can't reach database server"))) {
      return res.status(503).json({ error: "Database connection failed. Please ensure your local database is running and DATABASE_URL is set in .env." });
    }
    res.status(500).json({ error: "Google authentication failed" });
  }
});

// Get Current User (Session Restore)
router.get("/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "bookhunt_secret",
    );
    const user = await prisma.felhasznalo.findUnique({
      where: { felhasznalo_id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: user.felhasznalo_id,
        username: user.felhasznalonev,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
});

// authentication middleware that sets req.user
export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "bookhunt_secret",
    );
    req.user = { userId: decoded.userId };
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};

export default router;
