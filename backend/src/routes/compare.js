import express from 'express';
import axios from 'axios';
import { PrismaClient } from '../../generated/prisma/index.js';
import { scrapeLibri } from '../services/libriScraper.js';
import { scrapeBookline } from '../services/booklineScraper.js';
import { scrapeLibristo } from '../services/libristoScraper.js';
import { scrapeWalts } from '../services/waltsScraper.js';
import { scrapeAmazon } from '../services/amazonScraper.js';
import { scrapeCrunchyroll } from '../services/crunchyrollScraper.js';
import { scrapeThriftBooks } from '../services/thriftbooksScraper.js';
import { scrapeBarnesAndNoble } from '../services/barnesAndNobleScraper.js';
import { getUsdToHufRate, getEurToHufRate, convertToHuf } from '../utils/currency.js';

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
  const { currency = 'HUF' } = req.query;
  if (!isbn) return res.status(400).json({ error: 'ISBN is required' });

  try {
    let finalResultData = null;

    // 1. Check DB Cache
    const cached = await prisma.cachedPrice.findUnique({ where: { isbn } });
    if (cached) {
      const isFresh = (new Date() - cached.updatedAt) < 60 * 60 * 1000; // 1 hour
      if (isFresh) {
        finalResultData = cached.data;
      }
    }

    // 2. Fetch external if no valid cache
    if (!finalResultData) {
      const [
         booksRunRes, libriData, booklineData, libristoData, 
         waltsData, amazonData, crData, tbData, bnData, 
         usdRateRes, eurRateRes
      ] = await Promise.allSettled([
        axios.get(`${BOOKSRUN_BUY_URL}/buy/${isbn}`, { params: { key: process.env.BOOKSRUN_API_KEY } }),
        scrapeLibri(isbn),
        scrapeBookline(isbn),
        scrapeLibristo(isbn),
        scrapeWalts(isbn),
        scrapeAmazon(isbn),
        scrapeCrunchyroll(isbn),
        scrapeThriftBooks(isbn),
        scrapeBarnesAndNoble(isbn),
        getUsdToHufRate(),
        getEurToHufRate()
      ]);

      const offers = [];
      const rate = usdRateRes.status === 'fulfilled' ? usdRateRes.value : 360; // fallback USD rate
      const eurRate = eurRateRes.status === 'fulfilled' ? eurRateRes.value : 400; // fallback EUR rate

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
      
      if (waltsData.status === 'fulfilled' && waltsData.value) {
        const wData = waltsData.value;
        if (wData.currency === 'EUR') {
            wData.price = convertToHuf(wData.price, eurRate);
            wData.currency = 'HUF';
        }
        offers.push(wData);
      }
      
      if (amazonData.status === 'fulfilled' && amazonData.value) {
        const aData = amazonData.value;
        if (aData.currency === 'USD') {
            aData.price = convertToHuf(aData.price, rate);
            aData.currency = 'HUF';
        } else if (aData.currency === 'EUR') {
            aData.price = convertToHuf(aData.price, eurRate);
            aData.currency = 'HUF';
        }
        offers.push(aData);
      }
      
      // Parse New USD Scrapers
      const usdScrapers = [crData, tbData, bnData];
      for (const ds of usdScrapers) {
        if (ds.status === 'fulfilled' && ds.value) {
          const dData = ds.value;
          if (dData.currency === 'USD') {
            dData.price = convertToHuf(dData.price, rate);
            dData.currency = 'HUF';
          }
          offers.push(dData);
        }
      }

      // Sort all offers by lowest price first
      offers.sort((a, b) => a.price - b.price);

      // Save to Cache
      finalResultData = {
        isbn,
        fetchedAt: new Date(),
        offers
      };

      await prisma.cachedPrice.upsert({
        where: { isbn },
        update: { data: finalResultData, updatedAt: new Date() },
        create: { isbn, data: finalResultData }
      });
    }

    // 3. Output logic: Check if USD was requested
    if (currency.toUpperCase() === 'USD') {
      const liveUsdRate = await getUsdToHufRate().catch(() => 360);
      const convertedOffers = finalResultData.offers.map(offer => ({
        ...offer,
        price: Number((offer.price / liveUsdRate).toFixed(2)),
        currency: 'USD'
      }));
      return res.json({ ...finalResultData, offers: convertedOffers });
    }

    res.json(finalResultData);
  } catch (error) {
    console.error('Compare route error:', error);
    res.status(500).json({ error: 'Failed to fetch price comparisons' });
  }
});

export default router;
