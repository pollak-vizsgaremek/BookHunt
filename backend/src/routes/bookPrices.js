import express from "express";
import axios from "axios";
import { getUsdToHufRate, convertToHuf } from "../utils/currency.js";

const router = express.Router();

const BOOKSRUN_BUY_URL = "https://booksrun.com/api/v3/price";

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
// Allowlist pattern: ISBN-10 (9 digits + digit or X) or ISBN-13 (13 digits)
const ISBN_PATTERN = /^(?:\d{9}[\dX]|\d{13})$/;

router.get("/buy/:isbn", async (req, res) => {
  const { isbn } = req.params;
  const { currency = "USD" } = req.query;

  if (!isbn) {
    return res.status(400).json({ error: "ISBN is required." });
  }

  // SSRF prevention: reject any value that is not a valid ISBN-10 or ISBN-13
  if (!ISBN_PATTERN.test(isbn)) {
    return res.status(400).json({ error: "Invalid ISBN format. Must be a 10 or 13 digit ISBN." });
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
