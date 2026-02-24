import express from "express";
import { PrismaClient } from "../../generated/prisma/index.js";

const router = express.Router();
const prisma = new PrismaClient();

router.get("api/health", async (req, res) => {
    // res.send(`
    //   <h1>The server is running!</h1>
    //   <p>Server time: ${new Date().toISOString()}</p>
    //   <p>Available endpoints:</p>
    //   <ul>
    //     <li><a href="/">/</a> - Go back</li>
    //   </ul>
    // `);

    // To-do: check database connection, server status
    try {
        if (await prisma.$queryRaw`SELECT 1`) {
            console.log("Database connection is healthy");
        }
    } catch (error) {
        console.error("Health check error:", error);
        res.status(500).json({ error: "Health check failed" });
    }
  });

export default router;
