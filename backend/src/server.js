import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import webshopsRoutes from "./routes/webshops.js";
import productsRoutes from "./routes/products.js";
import priceHistoryRoutes from "./routes/priceHistory.js";
import favoritesRoutes from "./routes/favorites.js";
import searchesRoutes from "./routes/searches.js";
import notesRoutes from "./routes/notes.js";
import pricesRoutes from "./routes/prices.js";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api", webshopsRoutes);
app.use("/api", productsRoutes);
app.use("/api/price-history", priceHistoryRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/searches", searchesRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/prices", pricesRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.send(`
    <h1>The server is running!</h1>
    <p>Server time: ${new Date().toISOString()}</p>
    <p>Available endpoints:</p>
    <ul>
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
app.get("/", (req, res) => {
  res.send(`
    <h1>BookHunt API</h1>
    <p>Available endpoints:</p>
    <ul>
      <li><a href="/api/auth">/api/auth</a> - Authentication routes (register, login, me)</li>
      <li><a href="/api/health">/api/health</a> - Health check endpoint</li>
      <li><a href="/api/users">/api/users</a> - Get all users</a></li>
      <li><a href="/api/webshops">/api/webshops</a> - Get all webshops</a></li>
      <li><a href="/api/products">/api/products</a> - Get all products</a></li>
      <li><a href="/api/price-history">/api/price-history</a> - Get all price history</a></li>
      <li><a href="/api/favorites">/api/favorites</a> - Get all favorites</a></li>
      <li><a href="/api/searches">/api/searches</a> - Get all searches</a></li>
      <li><a href="/api/notes">/api/notes</a> - Get all notes</a></li>
      <li><a href="/api/prices">/api/prices</a> - Get all prices</a></li>
    </ul>
  `);
});

// Start server
app.listen(port, () => {
  console.log(`BookHunt server running on http://localhost:${port}`);
  console.log(`API endpoints available at http://localhost:${port}/api`);
});
