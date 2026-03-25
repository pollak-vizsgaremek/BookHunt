import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "../generated/prisma/index.js";
import authRoutes, { authenticate } from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import webshopsRoutes from "./routes/webshops.js";
import productsRoutes from "./routes/products.js";
import priceHistoryRoutes from "./routes/priceHistory.js";
import favoritesRoutes from "./routes/favorites.js";
import searchesRoutes from "./routes/searches.js";
import notesRoutes from "./routes/notes.js";
import pricesRoutes from "./routes/prices.js";
import reviewsRoutes from "./routes/reviews.js";
import booksRoutes from "./routes/books.js";
import bookPricesRoutes from "./routes/bookPrices.js";
import compareRoutes from "./routes/compare.js";
import kivansaglistaRoutes from "./routes/kivansaglista.js";
import ertesitesekRoutes from "./routes/ertesitesek.js";
import { startPriceAlerts } from "./scripts/priceAlertCron.js";

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BookHunt API",
      version: "1.0.0",
      description: "REST API documentation for the BookHunt backend",
    },
    servers: [{ url: "http://localhost:5000" }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const prisma = new PrismaClient();
const serverStartTime = new Date();

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/wishlist", kivansaglistaRoutes);
app.use("/api/notifications", ertesitesekRoutes);
app.use("/api", webshopsRoutes);
app.use("/api", productsRoutes);
app.use("/api/price-history", priceHistoryRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/searches", searchesRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/prices", pricesRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/books", booksRoutes);
app.use("/api/book-prices", bookPricesRoutes);
app.use("/api/compare", compareRoutes);

// Root route — server status page
app.get("/", async (req, res) => {
  try {
    if (await prisma.$queryRaw`SELECT 1`) {
      console.log("Database connection is healthy");
    }
    res.send(`
      <h1>The server is running fine!</h1>
      <p>Server started at: ${serverStartTime.toLocaleString()}</p>
      <p>Available endpoints:</p>
      <ul>
        <li><a href="/api/auth">/api/auth</a> - Authentication routes</li>
        <li><a href="/api/users">/api/users</a> - Get all users</li>
        <li><a href="/api/webshops">/api/webshops</a> - Get all webshops</li>
        <li><a href="/api/products">/api/products</a> - Get all products</li>
        <li><a href="/api/price-history">/api/price-history</a> - Get all price history</li>
        <li><a href="/api/favorites">/api/favorites</a> - Get all favorites</li>
        <li><a href="/api/searches">/api/searches</a> - Get all searches</li>
        <li><a href="/api/notes">/api/notes</a> - Get all notes</li>
        <li><a href="/api/prices">/api/prices</a> - Get all prices</li>
        <li><a href="/api/reviews">/api/reviews</a> - Product reviews</li>
      </ul>
    `);
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({ error: "Health check failed" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(port, () => {
  console.log(`BookHunt server running on http://localhost:${port}`);
  startPriceAlerts(prisma);
  console.log(`API endpoints available at http://localhost:${port}/api`);
  console.log(
    `Swagger documentation available at http://localhost:${port}/api-docs`,
  );
});
