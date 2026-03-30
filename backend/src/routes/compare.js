import express from 'express';
import { PrismaClient } from '../../generated/prisma/index.js';
import { runScrapers } from '../services/scraperOrchestrator.js';
import { getUsdToHufRate } from '../utils/currency.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/compare/{isbn}:
 *   get:
 *     summary: Compare book prices from multiple stores
 *     tags: [Compare]
 *     parameters:
 *       - in: path
 *         name: isbn
 *         required: true
 *         schema:
 *           type: string
 *         description: ISBN of the book
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           enum: [HUF, USD]
 *         description: Output currency (default HUF)
 *       - in: query
 *         name: refresh
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Force refresh cached data
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *         description: Comma-separated category list (e.g. "manga,comic")
 *     responses:
 *       200:
 *         description: Unified array of price offers
 *       400:
 *         description: Missing or invalid ISBN
 *       500:
 *         description: Failed to fetch price comparisons
 */
router.get('/:isbn', async (req, res) => {
  const { isbn } = req.params;
  const { currency = 'HUF', refresh = 'false', categories = '' } = req.query;

  if (!isbn || isbn.trim().length === 0) {
    return res.status(400).json({ error: 'ISBN is required' });
  }

  const categoryList = categories.toLowerCase().split(',');
  const isManga = categoryList.some(c => c.includes('manga'));
  const isComic = categoryList.some(c => c.includes('comic') || c.includes('graphic novel'));

  try {
    let finalResultData = null;

    // 1. Ellenőrzés: van érvényes cache-ünk?
    const cached = await prisma.gyorsitotarazottAr.findUnique({ where: { isbn } });
    if (cached && refresh !== 'true') {
      const isFresh = (new Date() - cached.frissitve) < 60 * 60 * 1000; // 1 óra
      if (isFresh) {
        finalResultData = cached.adatok;
      }
    }

    // 2. Ha nincs érvényes cache: scraperек futtatása az orchestrátoron keresztül
    if (!finalResultData) {
      const offers = await runScrapers({ isbn, isManga, isComic });

      finalResultData = {
        isbn,
        fetchedAt: new Date(),
        offers,
      };

      // Cache mentése / frissítése
      await prisma.gyorsitotarazottAr.upsert({
        where: { isbn },
        update: { adatok: finalResultData, frissitve: new Date() },
        create: { isbn, adatok: finalResultData },
      });
    }

    // 3. Kimeneti formátum: USD konverzió ha kell
    if (currency.toUpperCase() === 'USD') {
      const liveUsdRate = await getUsdToHufRate().catch(() => 360);
      const convertedOffers = finalResultData.offers.map(offer => ({
        ...offer,
        price: Number((offer.price / liveUsdRate).toFixed(2)),
        currency: 'USD',
      }));
      return res.json({ ...finalResultData, offers: convertedOffers });
    }

    res.json(finalResultData);
  } catch (error) {
    console.error(`Compare route error [ISBN: ${isbn}]:`, error);
    res.status(500).json({ error: 'Failed to fetch price comparisons' });
  }
});

export default router;
