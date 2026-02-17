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

// Routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.send(`
    <h1>The server is running!</h1>
    <p>Server time: ${new Date().toISOString()}</p>
    <p>Available endpoints:</p>
    <ul>
      <li><a href="/api/auth">/api/auth</a> - Authentication routes (register, login, me)</li>
      <li><a href="/">/</a> - Go back</li>
    </ul>
  `);
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Root: provide basic info, routing
app.use("/", (req, res) => {
  res.send(`
    <h1>BookHunt API</h1>
    <p>Available endpoints:</p>
    <ul>
      <li><a href="/api/auth">/api/auth</a> - Authentication routes (register, login, me)</li>
      <li><a href="/api/health">/api/health</a> - Health check endpoint</li>
    </ul>
  `);
});

// Start server
app.listen(port, () => {
  console.log(`BookHunt server running on http://localhost:${port}`);
  console.log(`API endpoints available at http://localhost:${port}/api`);
});
