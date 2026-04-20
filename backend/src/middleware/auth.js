import jwt from "jsonwebtoken";
import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "bookhunt_secret",
    async (err, user) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({ error: "Token expired" });
        }
        return res.status(401).json({ error: "Invalid token" });
      }

      // --- Instant Ban Check ---
      try {
        const dbUser = await prisma.felhasznalo.findUnique({
          where: { felhasznalo_id: user.userId },
          select: { tiltva_eddig: true, tiltas_oka: true }
        });

        if (dbUser && dbUser.tiltva_eddig && dbUser.tiltva_eddig > new Date()) {
          return res.status(403).json({
            error: "Banned",
            reason: dbUser.tiltas_oka,
            until: dbUser.tiltva_eddig
          });
        }
      } catch (e) {
        // Silently continue
      }

      req.user = user;
      next();
    },
  );
};