import express from "express";
import axios from "axios";
import { getUsdToHufRate, convertToHuf } from "../utils/currency.js";

const router = express.Router();

const BOOKSRUN_BUY_URL = "https://booksrun.com/api/v3/price";
const BOOKSRUN_SELL_URL = "https://booksrun.com/api/price";

/**
 * @swagger
 * /api/book-prices/buy/{isbn}:
 *   get:
 *     summary: Get buy and rent prices for a book by ISBN
 *     tags: [BookPrices]
 *     parameters:
 *       - in: path
 *         name: isbn
 *         required: true
 *         schema:
 *           type: string
 *         description: ISBN-10 or ISBN-13 of the book
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           enum: [USD, HUF]
 *         description: Currency to display prices in (default USD)
 *     responses:
 *       200:
 *         description: Buy and rent price data from BooksRun
 *       400:
 *         description: Missing ISBN
 *       500:
 *         description: Failed to fetch from BooksRun
 */
router.get("/buy/:isbn", async (req, res) => {
  const { isbn } = req.params;
  const { currency = "USD" } = req.query;

  if (!isbn) {
    return res.status(400).json({ error: "ISBN is required." });
  }

  try {
    const response = await axios.get(`${BOOKSRUN_BUY_URL}/buy/${isbn}`, {
      params: { key: process.env.BOOKSRUN_API_KEY },
    });

    const data = response.data;

    // If HUF is requested, fetch the live rate and convert all prices
    if (currency.toUpperCase() === "HUF") {
      const rate = await getUsdToHufRate();
      data._currency = "HUF";
      data._usdToHufRate = rate;
      data._note = "Prices converted from USD using ECB rate via frankfurter.app";
      convertPricesInObject(data, rate);
    } else {
      data._currency = "USD";
    }

    res.json(data);
  } catch (error) {
    console.error("BooksRun buy price error:", error.message);
    res.status(500).json({ error: "Failed to fetch buy prices from BooksRun." });
  }
});

/**
 * @swagger
 * /api/book-prices/sell/{isbn}:
 *   get:
 *     summary: Get the sellback (buyback) price for a book by ISBN
 *     tags: [BookPrices]
 *     parameters:
 *       - in: path
 *         name: isbn
 *         required: true
 *         schema:
 *           type: string
 *         description: ISBN-10 or ISBN-13 of the book
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           enum: [USD, HUF]
 *         description: Currency to display prices in (default USD)
 *     responses:
 *       200:
 *         description: Sellback price data from BooksRun
 *       400:
 *         description: Missing ISBN
 *       500:
 *         description: Failed to fetch from BooksRun
 */
router.get("/sell/:isbn", async (req, res) => {
  const { isbn } = req.params;
  const { currency = "USD" } = req.query;

  if (!isbn) {
    return res.status(400).json({ error: "ISBN is required." });
  }

  try {
    const response = await axios.get(`${BOOKSRUN_SELL_URL}/sell/${isbn}`, {
      params: { key: process.env.BOOKSRUN_API_KEY },
    });

    const data = response.data;

    // If HUF is requested, fetch the live rate and convert all prices
    if (currency.toUpperCase() === "HUF") {
      const rate = await getUsdToHufRate();
      data._currency = "HUF";
      data._usdToHufRate = rate;
      data._note = "Prices converted from USD using ECB rate via frankfurter.app";
      convertPricesInObject(data, rate);
    } else {
      data._currency = "USD";
    }

    res.json(data);
  } catch (error) {
    console.error("BooksRun sell price error:", error.message);
    res.status(500).json({ error: "Failed to fetch sell prices from BooksRun." });
  }
});

/**
 * Recursively walks through the BooksRun response object and
 * converts any numeric field named "price" or "shipping_price"
 * from USD to HUF using the given rate.
 *
 * @param {object} obj - The object to walk through
 * @param {number} rate - The USD → HUF exchange rate
 */
function convertPricesInObject(obj, rate) {
  if (typeof obj !== "object" || obj === null) return;

  // All field names that represent a USD price value in BooksRun responses
  const priceKeys = new Set(["price", "shipping_price", "Average", "Good", "New"]);

  for (const key of Object.keys(obj)) {
    if (priceKeys.has(key) && typeof obj[key] === "number") {
      obj[key] = convertToHuf(obj[key], rate);
    } else {
      convertPricesInObject(obj[key], rate);
    }
  }
}

export default router;
