/**
 * AppError – Egyedi hibaosztály saját HTTP státuszkóddal.
 * Használat: throw new AppError("Nem található", 404)
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

/**
 * Globális Express hibakezelő middleware.
 * Ez kell az app.use() hívások LEGVÉGÉN a server.js-ben.
 *
 * Felismeri:
 * - AppError (saját dobott hibák)
 * - Prisma P2002 (unique constraint violation → 409 Conflict)
 * - Prisma P2025 (record not found → 404 Not Found)
 * - Prisma P2003 (foreign key constraint → 400 Bad Request)
 * - JWT hibák (401)
 * - Minden egyéb → 500 Internal Server Error
 */
export const errorHandler = (err, req, res, next) => {
  // Már küldtünk választ, ne küldjünk mégegyet
  if (res.headersSent) {
    return next(err);
  }

  // Primsma-specifikus hibakódok kezelése
  if (err.code) {
    switch (err.code) {
      case "P2002": {
        const field = err.meta?.target?.[0] || "field";
        return res.status(409).json({
          error: `A(z) "${field}" már foglalt. Kérlek válassz másikat.`,
        });
      }
      case "P2025":
        return res.status(404).json({ error: "A keresett rekord nem található." });
      case "P2003":
        return res.status(400).json({ error: "Érvénytelen hivatkozás – a kapcsolódó rekord nem létezik." });
      default:
        break;
    }
  }

  // JWT hibák
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired" });
  }
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token" });
  }

  // Saját AppError
  if (err.name === "AppError") {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Ismeretlen hiba – ne szivárogjon ki belső info
  console.error(`[${new Date().toISOString()}] Unhandled error on ${req.method} ${req.path}:`, err);
  res.status(500).json({ error: "Internal server error" });
};
