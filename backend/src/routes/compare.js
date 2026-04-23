import express from 'express';
import { PrismaClient } from '../../generated/prisma/index.js';
import { runScrapers } from '../services/scraperOrchestrator.js';
import { getUsdToHufRate } from '../utils/currency.js';
import { normalizeAndValidateIsbn } from '../utils/isbn.js';

const router = express.Router();
const prisma = new PrismaClient();

function sanitizeRows(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => ({
    store:     typeof item.store     === 'string' ? item.store     : String(item.store ?? ''),
    condition: typeof item.condition === 'string' ? item.condition : undefined,
    price:     typeof item.price     === 'number' ? item.price     : undefined,
    currency:  typeof item.currency  === 'string' ? item.currency  : undefined,
    buyUrl:    typeof item.buyUrl    === 'string' ? item.buyUrl    : undefined,
    status:    typeof item.status    === 'string' ? item.status    : undefined,
  }));
}

function sanitizeOffer(item) {
  return {
    store:     typeof item.store     === 'string' ? item.store     : String(item.store ?? ''),
    condition: typeof item.condition === 'string' ? item.condition : undefined,
    price:     typeof item.price     === 'number' ? item.price     : undefined,
    currency:  typeof item.currency  === 'string' ? item.currency  : undefined,
    buyUrl:    typeof item.buyUrl    === 'string' ? item.buyUrl    : undefined,
    status:    typeof item.status    === 'string' ? item.status    : undefined,
  };
}

router.get('/:isbn', async (req, res) => {
  const { isbn } = req.params;
  const { currency = 'HUF', refresh = 'false', categories = '', language = '', stream = 'false' } = req.query;

  if (!isbn || isbn.trim().length === 0) {
    if (stream === 'true') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.flushHeaders();
      res.write(`event: ERROR\ndata: ${JSON.stringify({ error: 'ISBN is required' })}\n\n`);
      return res.end();
    }
    return res.status(400).json({ error: 'ISBN is required' });
  }

  let safeIsbn;
  try {
    safeIsbn = normalizeAndValidateIsbn(isbn);
  } catch {
    if (stream === 'true') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.flushHeaders();
      res.write(`event: ERROR\ndata: ${JSON.stringify({ error: 'Invalid ISBN format' })}\n\n`);
      return res.end();
    }
    return res.status(400).json({ error: 'Invalid ISBN format' });
  }

  const categoryList = categories.toLowerCase().split(',');
  const isManga = categoryList.some(c => c.includes('manga'));
  const isComic = categoryList.some(c => c.includes('comic') || c.includes('graphic novel'));
  // If language is explicitly 'hu' OR categories hint Hungarian content, run Hungarian store scrapers
  const isHungarian = language.toLowerCase() === 'hu' || categoryList.some(c => c.includes('hungarian') || c.includes('magyar'));

  const isStream = stream === 'true';

  if (isStream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
  }

  try {
    const cached = await prisma.gyorsitotarazottAr.findUnique({ where: { isbn: safeIsbn } });
    const isFresh = cached && refresh !== 'true' && (new Date() - cached.frissitve) < 60 * 60 * 1000;

    const liveUsdRate = currency.toUpperCase() === 'USD' ? await getUsdToHufRate().catch(() => 360) : null;

    if (isFresh) {
      if (isStream) {
        // Init event based on cache mapping
        res.write(`event: INIT\ndata: ${JSON.stringify(cached.adatok.allRows.map(r => ({ store: r.store, status: 'Loading' })))}\n\n`);
        
        let offers = cached.adatok.offers;
        let allRows = cached.adatok.allRows;

        if (currency.toUpperCase() === 'USD' && liveUsdRate) {
           offers = offers.map(o => ({...o, price: Number((o.price / liveUsdRate).toFixed(2)), currency: 'USD'}));
           allRows = allRows.map(o => o.price ? {...o, price: Number((o.price / liveUsdRate).toFixed(2)), currency: 'USD'} : o);
        }

        for (const row of allRows) {
            res.write(`event: UPDATE\ndata: ${JSON.stringify(row)}\n\n`);
        }
        res.write(`event: DONE\ndata: ${JSON.stringify({ offers, allRows })}\n\n`);
        res.end();
        return;
      } else {
        let result = cached.adatok;
        if (currency.toUpperCase() === 'USD' && liveUsdRate) {
           const convertedOffers = result.offers.map(o => ({...o, price: Number((o.price / liveUsdRate).toFixed(2)), currency: 'USD'}));
           result = { ...result, offers: convertedOffers };
        }
        return res.json(result);
      }
    }

    if (isStream) {
      const expectedStores = [{ store: 'BooksRun', status: 'Loading' }];
      if (isManga) {
         expectedStores.push({ store: 'Walts Comic Shop', status: 'Loading' });
         expectedStores.push({ store: 'Amazon', status: 'Loading' });
         expectedStores.push({ store: 'Crunchyroll', status: 'Loading' });
      } else {
         if (isComic) expectedStores.push({ store: 'Walts Comic Shop', status: 'Loading' });
         if (isHungarian) {
           expectedStores.push({ store: 'libri.hu', status: 'Loading' });
           expectedStores.push({ store: 'bookline.hu', status: 'Loading' });
           expectedStores.push({ store: 'Libristo', status: 'Loading' });
         }
         expectedStores.push({ store: 'Amazon', status: 'Loading' });
         expectedStores.push({ store: 'ThriftBooks', status: 'Loading' });
         expectedStores.push({ store: 'BarnesAndNoble', status: 'Loading' });
      }
      res.write(`event: INIT\ndata: ${JSON.stringify(expectedStores)}\n\n`);
    }

    const { offers, allRows } = await runScrapers({
      isbn: safeIsbn,
      isManga,
      isComic,
      isHungarian,
      onProgress: isStream ? (row) => {
         let outRow = sanitizeOffer(row);
         if (currency.toUpperCase() === 'USD' && liveUsdRate && outRow.price) {
             outRow.price = Number((outRow.price / liveUsdRate).toFixed(2));
             outRow.currency = 'USD';
         }
         res.write(`event: UPDATE\ndata: ${JSON.stringify(outRow)}\n\n`);
      } : null
    });

    const safeOffers  = sanitizeRows(offers);
    const safeAllRows = sanitizeRows(allRows);

    const finalResultData = {
      isbn: safeIsbn,
      fetchedAt: new Date().toISOString(),
      offers: safeOffers,
      allRows: safeAllRows,
    };

    await prisma.gyorsitotarazottAr.upsert({
      where: { isbn: safeIsbn },
      update: { adatok: finalResultData, frissitve: new Date() },
      create: { isbn: safeIsbn, adatok: finalResultData },
    });

    if (isStream) {
      let outOffers = safeOffers;
      let outAllRows = safeAllRows;
      if (currency.toUpperCase() === 'USD' && liveUsdRate) {
          outOffers = safeOffers.map(o => ({...o, price: Number((o.price / liveUsdRate).toFixed(2)), currency: 'USD'}));
          outAllRows = safeAllRows.map(o => o.price ? {...o, price: Number((o.price / liveUsdRate).toFixed(2)), currency: 'USD'} : o);
      }
      res.write(`event: DONE\ndata: ${JSON.stringify({ offers: outOffers, allRows: outAllRows })}\n\n`);
      res.end();
    } else {
      let result = finalResultData;
      if (currency.toUpperCase() === 'USD' && liveUsdRate) {
          const convertedOffers = safeOffers.map(o => ({...o, price: Number((o.price / liveUsdRate).toFixed(2)), currency: 'USD'}));
          result = { ...result, offers: convertedOffers };
      }
      res.json(result);
    }

  } catch (error) {
    console.error(`Compare route error [ISBN: ${safeIsbn ?? 'invalid'}]: ${error?.message ?? error}`);
    if (isStream) {
      res.write(`event: ERROR\ndata: ${JSON.stringify({ error: 'Failed to fetch price comparisons' })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: 'Failed to fetch price comparisons' });
    }
  }
});

export default router;
