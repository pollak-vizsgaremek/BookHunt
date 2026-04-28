import express from "express";
import { PrismaClient } from "../../generated/prisma/index.js";

const router = express.Router();
const prisma = new PrismaClient();

const isMissingGlobalSettingsTable = (error) => {
  return (
    error?.code === "P2021" &&
    (error?.meta?.modelName === "GlobalSettings" ||
      error?.meta?.table === "GlobalSettings")
  );
};

/**
 * @swagger
 * /api/settings/theme:
 *   get:
 *     summary: Get the global site theme
 *     tags: [Settings]
 */
router.get("/theme", async (req, res) => {
  try {
    let settings = await prisma.globalSettings.findUnique({ where: { id: 1 } });
    
    // If not exists, create default
    if (!settings) {
      settings = await prisma.globalSettings.create({ data: { id: 1, theme: "default" } });
    }
    
    res.json({ theme: settings.theme });
  } catch (error) {
    if (isMissingGlobalSettingsTable(error)) {
      console.warn(
        "[Settings] GlobalSettings table missing. Returning default theme. Run `prisma migrate deploy` in production.",
      );
      return res.json({ theme: "default" });
    }

    console.error("[Settings] Error fetching theme:", error);
    res.status(500).json({ error: "Failed to fetch theme" });
  }
});

export default router;