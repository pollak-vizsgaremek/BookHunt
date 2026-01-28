import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";

// Load environment variables
dotenv.config();

const app = express()
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "BookHunt server is running" });
  });

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
  });
  
// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  });
  
  // Start server
app.listen(PORT, () => {
    console.log(`BookHunt server running on http://localhost:${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
  });
