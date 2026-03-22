import express from 'express';
import axios from 'axios';
import { PrismaClient } from '../../generated/prisma/index.js';
import { scrapeLibri } from '../services/libriScraper.js';
import { scrapeBookline } from '../services/booklineScraper.js';
import { scrapeLibristo } from '../services/libristoScraper.js';
import { getUsdToHufRate, convertToHuf } from '../utils/currencyHelpers.js';

const router = express.Router();
const prisma = new PrismaClient();

const BOOKSRUN_BUY_URL = 'https://booksrun.com/api/v3/price';

/**
 * @swagger
 * /api/compare/{isbn}:
 *   get:
 *     summary: Compare book prices from BooksRun, Libri, and Bookline
 *     tags: [Compare]
 *     parameters:
 *       - in: path
 *         name: isbn
 *         required: true
 *         schema:
 *           type: string
 *         description: ISBN of the book
 *     responses:
 *       200:
 *         description: Unified array of price offers
 */
router.get('/:isbn', async (req, res) => {
  const { isbn } = req.params;
  if (!isbn) return res.status(400).json({ error: 'ISBN is required' });

  try {
    // 1. Check DB Cache
    const cached = await prisma.cachedPrice.findUnique({ where: { isbn } });
    if (cached) {
      const isFresh = (new Date() - cached.updatedAt) < 60 * 60 * 1000; // 1 hour
      if (isFresh) {
        return res.json(cached.data);
      }
    }

    // 2. Fetch all sources in parallel
    const [booksRunRes, libriData, booklineData, libristoData, rateRes] = await Promise.allSettled([
      axios.get(`${BOOKSRUN_BUY_URL}/buy/${isbn}`, { params: { key: process.env.BOOKSRUN_API_KEY } }),
      scrapeLibri(isbn),
      scrapeBookline(isbn),
      scrapeLibristo(isbn),
      getUsdToHufRate()
    ]);

    const offers = [];
    const rate = rateRes.status === 'fulfilled' ? rateRes.value : 360; // fallback

    // Parse BooksRun
    if (booksRunRes.status === 'fulfilled' && booksRunRes.value.data?.result?.status === 'success') {
      const brData = booksRunRes.value.data.result.text;
      
      if (brData?.New?.price) {
        offers.push({
          store: 'BooksRun',
          condition: 'New',
          price: convertToHuf(brData.New.price, rate),
          currency: 'HUF',
          buyUrl: brData.New.cart_url
        });
      }

      if (brData?.Used?.Good?.price) {
        offers.push({
          store: 'BooksRun',
          condition: 'Used',
          price: convertToHuf(brData.Used.Good.price, rate),
          currency: 'HUF',
          buyUrl: brData.Used.Good.cart_url
        });
      }
    }

    // Parse Scrapers
    if (libriData.status === 'fulfilled' && libriData.value) {
      offers.push(libriData.value);
    }
    if (booklineData.status === 'fulfilled' && booklineData.value) {
      offers.push(booklineData.value);
    }
    if (libristoData.status === 'fulfilled' && libristoData.value) {
      offers.push(libristoData.value);
    }

    // 3. Save to Cache
    const result = {
      isbn,
      fetchedAt: new Date(),
      offers
    };

    await prisma.cachedPrice.upsert({
      where: { isbn },
      update: { data: result, updatedAt: new Date() },
      create: { isbn, data: result }
    });

    res.json(result);
  } catch (error) {
    console.error('Compare route error:', error);
    res.status(500).json({ error: 'Failed to fetch price comparisons' });
  }
});

export default router;
