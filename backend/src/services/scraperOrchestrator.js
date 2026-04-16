/**
 * scraperOrchestrator.js
 *
 * Központi orchestrátor, ami az összes scrapért párhuzamosan futtatja
 * feltételeken alapuló streaming (onProgress) támogatással.
 */

import axios from 'axios';
import { scrapeLibri } from './libriScraper.js';
import { scrapeBookline } from './booklineScraper.js';
import { scrapeLibristo } from './libristoScraper.js';
import { scrapeWalts } from './waltsScraper.js';
import { scrapeAmazon } from './amazonScraper.js';
import { scrapeCrunchyroll } from './crunchyrollScraper.js';
import { scrapeThriftBooks } from './thriftbooksScraper.js';
import { scrapeBarnesAndNoble } from './barnesAndNobleScraper.js';
import { getUsdToHufRate, getEurToHufRate, convertToHuf } from '../utils/currency.js';
import { withTimeout } from '../utils/timeout.js';
import { normalizeAndValidateIsbn } from '../utils/isbn.js';

const BOOKSRUN_BUY_URL = 'https://booksrun.com/api/v3/price';
const DEFAULT_SCRAPER_TIMEOUT_MS = 60000;
const DEFAULT_RATE_TIMEOUT_MS = 10000;

function extractOffer(status, value, reason, storeName) {
  if (status === 'fulfilled') {
    if (value === null || value === undefined) {
      return { store: storeName, status: 'Not Found' };
    }
    if (value instanceof Error) {
      const s = value.scraperStatus || 'Not Found';
      return { store: storeName, status: s };
    }
    return { ...value, status: value.status || 'Found' };
  }
  if (reason) {
    const scraperStatus = reason.scraperStatus || 'Error';
    return { store: storeName, status: scraperStatus };
  }
  return { store: storeName, status: 'Error' };
}

export async function runScrapers({ isbn, isManga = false, isComic = false, usdRate = null, eurRate = null, onProgress = null }) {
  if (!isbn) {
    throw new Error('scraperOrchestrator: isbn is required');
  }

  let safeIsbn;
  try {
    safeIsbn = normalizeAndValidateIsbn(isbn);
  } catch {
    throw new Error('scraperOrchestrator: invalid ISBN format');
  }

  const booksRunBuyUrl = new URL(`${BOOKSRUN_BUY_URL.replace(/\/+$/, '')}/buy/${encodeURIComponent(safeIsbn)}`).toString();

  // Load rates first so we can sync convert streaming offers
  const resolvedUsdRate = usdRate !== null ? usdRate : await withTimeout((signal) => getUsdToHufRate(signal), DEFAULT_RATE_TIMEOUT_MS).catch(() => 360);
  const resolvedEurRate = eurRate !== null ? eurRate : await withTimeout((signal) => getEurToHufRate(signal), DEFAULT_RATE_TIMEOUT_MS).catch(() => 400);

  const offers = [];
  const allRows = [];

  const handleResult = (row) => {
    allRows.push(row);
    if (row.status === 'Found' && typeof row.price === 'number' && row.price > 0) {
      offers.push(row);
    }
    if (onProgress) onProgress(row);
  };

  // Wrapper blocks for mapping async scrapers into formatted events immediately
  const runBooksRun = async () => {
    try {
      const res = await withTimeout((signal) => axios.get(booksRunBuyUrl, { params: { key: process.env.BOOKSRUN_API_KEY }, signal }), DEFAULT_SCRAPER_TIMEOUT_MS);
      if (res?.data?.result?.status === 'success') {
        const brData = res.data.result.text;
        let foundAny = false;
        if (brData?.New?.price) {
          handleResult({ store: 'BooksRun', condition: 'New', price: convertToHuf(brData.New.price, resolvedUsdRate), currency: 'HUF', buyUrl: brData.New.cart_url || null, status: 'Found' });
          foundAny = true;
        }
        if (brData?.Used?.Good?.price) {
          handleResult({ store: 'BooksRun', condition: 'Used', price: convertToHuf(brData.Used.Good.price, resolvedUsdRate), currency: 'HUF', buyUrl: brData.Used.Good.cart_url || null, status: 'Found' });
          foundAny = true;
        }
        if (!foundAny && !isManga) {
            handleResult({ store: 'BooksRun', status: 'Not Found' });
        }
      } else if (!isManga) {
        handleResult({ store: 'BooksRun', status: 'Not Found' });
      }
    } catch (err) {
      if (!isManga) handleResult({ store: 'BooksRun', status: 'Error' });
      console.warn('[Orchestrator] BooksRun scraper failed for ISBN', safeIsbn + ':', err.message);
    }
  };

  const runGenericHufScraper = async (scraperFn, storeName, runCondition) => {
    if (!runCondition) return;
    try {
      const res = await withTimeout((signal) => scraperFn(safeIsbn, signal), DEFAULT_SCRAPER_TIMEOUT_MS);
      const row = extractOffer('fulfilled', res, null, storeName);
      if (row) handleResult(row);
    } catch (err) {
      const row = extractOffer('rejected', null, err, storeName);
      if (row) handleResult(row);
      console.warn('[Orchestrator]', storeName, 'scraper failed for ISBN', safeIsbn + ':', err.message);
    }
  };

  const runGenericUsdEurScraper = async (scraperFn, storeName, runCondition, isFallbackEur = false) => {
    if (!runCondition) return;
    try {
      const res = await withTimeout((signal) => scraperFn(safeIsbn, signal), DEFAULT_SCRAPER_TIMEOUT_MS);
      const row = extractOffer('fulfilled', res, null, storeName);
      if (row) {
        if (row.status === 'Found' && row.price) {
           if (row.currency === 'USD') {
             row.price = convertToHuf(row.price, resolvedUsdRate);
             row.currency = 'HUF';
           } else if (row.currency === 'EUR' || isFallbackEur) {
             row.price = convertToHuf(row.price, resolvedEurRate);
             row.currency = 'HUF';
           }
        }
        handleResult(row);
      }
    } catch (err) {
      const row = extractOffer('rejected', null, err, storeName);
      if (row) handleResult(row);
      console.warn('[Orchestrator]', storeName, 'scraper failed for ISBN', safeIsbn + ':', err.message);
    }
  };

  const scraperPromises = [
    runBooksRun(),
    runGenericHufScraper(scrapeLibri, 'libri.hu', !isManga),
    runGenericHufScraper(scrapeBookline, 'bookline.hu', !isManga),
    runGenericHufScraper(scrapeLibristo, 'Libristo', !isManga),
    runGenericUsdEurScraper(scrapeWalts, 'Walts Comic Shop', isComic || isManga, true),
    runGenericUsdEurScraper(scrapeAmazon, 'Amazon', true),
    runGenericUsdEurScraper(scrapeCrunchyroll, 'Crunchyroll', isManga),
    runGenericUsdEurScraper(scrapeThriftBooks, 'ThriftBooks', !isManga),
    runGenericUsdEurScraper(scrapeBarnesAndNoble, 'BarnesAndNoble', !isManga)
  ];

  await Promise.allSettled(scraperPromises);

  // Szűrés: csak érvényes (> 0) árak, rendezés legolcsóbbtól
  offers.sort((a, b) => a.price - b.price);

  return {
    offers,
    allRows,
  };
}
