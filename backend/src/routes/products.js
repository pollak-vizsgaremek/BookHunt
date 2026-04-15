import express from "express";
import { PrismaClient } from "../../generated/prisma/index.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/product:
 *   post:
 *     summary: Manually add a product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cim, tipus]
 *             properties:
 *               cim:
 *                 type: string
 *               tipus:
 *                 type: string
 *               szerzo:
 *                 type: string
 *                 description: Author name or comma-separated names
 *               isbn_issn:
 *                 type: string
 *               boritokep:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product added successfully
 */
router.post("/product", async (req, res) => {
  try {
    const { cim, tipus, szerzo, isbn_issn, boritokep } = req.body;

    const szerzoList = szerzo 
      ? (Array.isArray(szerzo) ? szerzo : szerzo.split(',').map(s => s.trim())) 
      : [];

    const product = await prisma.termek.create({
      data: {
        cim,
        tipus,
        isbn_issn,
        boritokep,
        Szerzok: {
          connectOrCreate: szerzoList.map(name => ({
            where: { nev: name },
            create: { nev: name }
          }))
        }
      },
      include: {
        Szerzok: true
      }
    });

    res.status(201).json({
      message: "Product added successfully",
      product: {
        id: product.termek_id,
        cim: product.cim,
        tipus: product.tipus,
        szerzok: product.Szerzok.map(s => s.nev),
        isbn_issn: product.isbn_issn,
        boritokep: product.boritokep,
      },
    });
  } catch (error) {
    console.error("Product creation error:", error);
    res.status(500).json({ error: "Product creation failed" });
  }
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 */
router.get("/products", async (req, res) => {
  try {
    const products = await prisma.termek.findMany({
      include: {
        Szerzok: true
      }
    });
    
    const formattedProducts = products.map(p => ({
      termek_id: p.termek_id,
      cim: p.cim,
      tipus: p.tipus,
      szerzok: p.Szerzok.map(s => s.nev),
      isbn_issn: p.isbn_issn,
      boritokep: p.boritokep,
    }));

    res.json(formattedProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 */
router.get("/:id", async (req, res) => {
  try {
    const termek_id = parseInt(req.params.id);
    const product = await prisma.termek.findUnique({
      where: { termek_id },
      include: {
        Szerzok: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const formattedProduct = {
      termek_id: product.termek_id,
      cim: product.cim,
      tipus: product.tipus,
      szerzok: product.Szerzok.map(s => s.nev),
      isbn_issn: product.isbn_issn,
      boritokep: product.boritokep,
    };

    res.json(formattedProduct);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

export default router;
