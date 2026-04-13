/**
 * scraperOrchestrator.js
 *
 * Központi orchestrátor, ami az összes scrapért párhuzamosan futtatja
 * Promise.allSettled-del, így egy sikertelen scraper nem állítja le a többit.
 *
 * Használat:
 *   import { runScrapers } from '../services/scraperOrchestrator.js';
 *   const offers = await runScrapers({ isbn, isManga: false, isComic: false, usdRate: 360, eurRate: 400 });
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

const BOOKSRUN_BUY_URL = 'https://booksrun.com/api/v3/price';
const DEFAULT_SCRAPER_TIMEOUT_MS = 25000;
const DEFAULT_RATE_TIMEOUT_MS = 10000;

/**
 * Egységes ajánlat-formátum, amit minden scraper visszaad:
 * @typedef {Object} Offer
 * @property {string} store       - A webshop neve (pl. "libri.hu")
 * @property {string} condition   - "New" | "Used"
 * @property {number} price       - Ár HUF-ban
 * @property {string} currency    - Mindig "HUF" (az orchestrátor konvertálja)
 * @property {string|null} buyUrl - Vásárlási link
 */

/**
 * Futtatja az összes releváns scrapért egy adott ISBN-re párhuzamosan.
 *
 * @param {Object} params
 * @param {string} params.isbn        - A könyv ISBN száma
 * @param {boolean} [params.isManga]  - Ha igaz, a Crunchyroll scrapért is futtatja
 * @param {boolean} [params.isComic]  - Ha igaz, a Walts scrapért is futtatja
 * @param {number} [params.usdRate]   - USD→HUF árfolyam (ha ismert, nem kér le újat)
 * @param {number} [params.eurRate]   - EUR→HUF árfolyam (ha ismert, nem kér le újat)
 * @returns {Promise<Offer[]>}        - Érvényes ajánlatok tömbje, ár szerint rendezve
 */
export async function runScrapers({ isbn, isManga = false, isComic = false, usdRate = null, eurRate = null }) {
  if (!isbn) {
    throw new Error('scraperOrchestrator: isbn is required');
  }

  // Árfolyamok lekérése ha nincsenek megadva
  const ratePromises = [
    usdRate !== null ? Promise.resolve(usdRate) : withTimeout((signal) => getUsdToHufRate(signal), DEFAULT_RATE_TIMEOUT_MS),
    eurRate !== null ? Promise.resolve(eurRate) : withTimeout((signal) => getEurToHufRate(signal), DEFAULT_RATE_TIMEOUT_MS),
  ];

  const scraperPromises = [
    withTimeout(
      (signal) => axios.get(`${BOOKSRUN_BUY_URL}/buy/${isbn}`, {
        params: { key: process.env.BOOKSRUN_API_KEY },
        signal
      }),
      DEFAULT_SCRAPER_TIMEOUT_MS
    ),
    withTimeout((signal) => scrapeLibri(isbn, signal), DEFAULT_SCRAPER_TIMEOUT_MS),
    withTimeout((signal) => scrapeBookline(isbn, signal), DEFAULT_SCRAPER_TIMEOUT_MS),
    withTimeout((signal) => scrapeLibristo(isbn, signal), DEFAULT_SCRAPER_TIMEOUT_MS),
    isComic ? withTimeout((signal) => scrapeWalts(isbn, signal), DEFAULT_SCRAPER_TIMEOUT_MS) : Promise.resolve(null),
    withTimeout((signal) => scrapeAmazon(isbn, signal), DEFAULT_SCRAPER_TIMEOUT_MS),
    isManga ? withTimeout((signal) => scrapeCrunchyroll(isbn, signal), DEFAULT_SCRAPER_TIMEOUT_MS) : Promise.resolve(null),
    withTimeout((signal) => scrapeThriftBooks(isbn, signal), DEFAULT_SCRAPER_TIMEOUT_MS),
    withTimeout((signal) => scrapeBarnesAndNoble(isbn, signal), DEFAULT_SCRAPER_TIMEOUT_MS),
    ...ratePromises,
  ];

  const results = await Promise.allSettled(scraperPromises);

  const [
    booksRunRes, libriRes, booklineRes, libristoRes,
    waltsRes, amazonRes, crunchyrollRes, thriftRes, bnRes,
    usdRateRes, eurRateRes,
  ] = results;

  // Logolás: melyik scraper sikerült / bukott
  const scraperNames = ['BooksRun', 'Libri', 'Bookline', 'Libristo', 'Walts', 'Amazon', 'Crunchyroll', 'ThriftBooks', 'BarnesAndNoble'];
  scraperNames.forEach((name, i) => {
    if (results[i].status === 'rejected') {
      console.warn(`[Orchestrator] ${name} scraper failed for ISBN ${isbn}:`, results[i].reason?.message || results[i].reason);
    }
  });

  const resolvedUsdRate = usdRateRes.status === 'fulfilled' ? usdRateRes.value : 360;
  const resolvedEurRate = eurRateRes.status === 'fulfilled' ? eurRateRes.value : 400;

  const offers = [];

  // ---- BooksRun (API) ----
  if (booksRunRes.status === 'fulfilled' && booksRunRes.value?.data?.result?.status === 'success') {
    const brData = booksRunRes.value.data.result.text;
    if (brData?.New?.price) {
      offers.push({
        store: 'BooksRun',
        condition: 'New',
        price: convertToHuf(brData.New.price, resolvedUsdRate),
        currency: 'HUF',
        buyUrl: brData.New.cart_url || null,
      });
    }
    if (brData?.Used?.Good?.price) {
      offers.push({
        store: 'BooksRun',
        condition: 'Used',
        price: convertToHuf(brData.Used.Good.price, resolvedUsdRate),
        currency: 'HUF',
        buyUrl: brData.Used.Good.cart_url || null,
      });
    }
  }

  // ---- HUF scrapers (Libri, Bookline) ----
  for (const res of [libriRes, booklineRes, libristoRes]) {
    if (res.status === 'fulfilled' && res.value) {
      offers.push(res.value);
    }
  }

  // ---- Walts (EUR) ----
  if (waltsRes.status === 'fulfilled' && waltsRes.value) {
    const w = { ...waltsRes.value };
    if (w.currency === 'EUR') {
      w.price = convertToHuf(w.price, resolvedEurRate);
      w.currency = 'HUF';
    }
    offers.push(w);
  }

  // ---- Amazon (USD or EUR) ----
  if (amazonRes.status === 'fulfilled' && amazonRes.value) {
    const a = { ...amazonRes.value };
    if (a.currency === 'USD') {
      a.price = convertToHuf(a.price, resolvedUsdRate);
      a.currency = 'HUF';
    } else if (a.currency === 'EUR') {
      a.price = convertToHuf(a.price, resolvedEurRate);
      a.currency = 'HUF';
    }
    offers.push(a);
  }

  // ---- USD scrapers (Crunchyroll, ThriftBooks, Barnes & Noble) ----
  for (const res of [crunchyrollRes, thriftRes, bnRes]) {
    if (res.status === 'fulfilled' && res.value) {
      const d = { ...res.value };
      if (d.currency === 'USD') {
        d.price = convertToHuf(d.price, resolvedUsdRate);
        d.currency = 'HUF';
      }
      offers.push(d);
    }
  }

  // Szűrés: csak érvényes (> 0) árak, rendezés legolcsóbbtól
  const validOffers = offers.filter(o => typeof o.price === 'number' && o.price > 0);
  validOffers.sort((a, b) => a.price - b.price);

  return validOffers;
}
