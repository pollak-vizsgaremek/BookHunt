import jwt from "jsonwebtoken";

/**
 * requireAdmin middleware
 *
 * Kell elé az `authenticate` middleware (ami beállítja req.user-t).
 * Ez a middleware CSAK az ADMIN szerepkörű felhasználóknak engedi át a kérést.
 *
 * Ha a JWT-ben nincs szerepkör mező (régi token), megtagadja a hozzáférést.
 *
 * Használat:
 *   router.get("/admin/users", authenticate, requireAdmin, handler);
 *
 * HTTP válaszok:
 *   401 — ha nincs token, vagy a token érvénytelen (az authenticate kezeli)
 *   403 — ha a felhasználó be van lépve, de nincs ADMIN joga
 */
export const requireAdmin = (req, res, next) => {
  // Az authenticate middleware már beállította req.user-t
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.szerepkor !== "ADMIN") {
    return res.status(403).json({
      error: "Forbidden: Admin access required",
    });
  }

  next();
};
