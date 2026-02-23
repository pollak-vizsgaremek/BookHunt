import express from "express";
import { PrismaClient } from "../../generated/prisma/index.js";

const router = express.Router();
const prisma = new PrismaClient();

// manually post product
router.post("/product", async (req, res) => {
  try {
    const { cim, tipus, szerzo, isbn_issn, boritokep } = req.body;

    const product = await prisma.termek.create({
      data: {
        cim,
        tipus,
        szerzo,
        isbn_issn,
        boritokep,
      },
    });

    res.status(201).json({
      message: "Product added successfully",
      product: {
        id: product.termek_id,
        cim: product.cim,
        tipus: product.tipus,
        szerzo: product.szerzo,
        isbn_issn: product.isbn_issn,
        boritokep: product.boritokep,
      },
    });
  } catch (error) {
    console.error("Product creation error:", error);
    res.status(500).json({ error: "Product creation failed" });
  }
});

// get all products
router.get("/products", async (req, res) => {
  try {
    const products = await prisma.termek.findMany({
      select: {
        termek_id: true,
        cim: true,
        tipus: true,
        szerzo: true,
        isbn_issn: true,
        boritokep: true,
      },
    });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const termek_id = parseInt(req.params.id);
    const product = await prisma.termek.findUnique({
      where: { termek_id },
      select: {
        termek_id: true,
        cim: true,
        tipus: true,
        szerzo: true,
        isbn_issn: true,
        boritokep: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

export default router;
