/**
 * scraperOrchestrator.js
 *
 * Központi orchestrátor, ami az összes scrapért párhuzamosan futtatja
 * Promise.allSettled-del, így egy sikertelen scraper nem állítja le a többit.
 *
 * Logika:
 *  - Ha item.category === 'MANGA': csak a Walts, Amazon és Crunchyroll scrapereket futtatja.
 *    A Libri, Bookline, Libristo, ThriftBooks és Barnes & Noble scrapereket kihagyja.
 *  - Minden scraper statuszt ad vissza: 'Found' | 'Not Found' | 'Error'
 *    a frontend táblában való megjelenítéshez.
 *
 * Használat:
 *   import { runScrapers } from '../services/scraperOrchestrator.js';
 *   const { offers, allRows } = await runScrapers({ isbn, isManga, isComic, usdRate, eurRate });
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
const DEFAULT_SCRAPER_TIMEOUT_MS = 25000;
const DEFAULT_RATE_TIMEOUT_MS = 10000;

/**
 * Egységes ajánlat-formátum, amit minden scraper visszaad:
 * @typedef {Object} Offer
 * @property {string} store        - A webshop neve (pl. "libri.hu")
 * @property {string} [condition]  - "New" | "Used"
 * @property {number} [price]      - Ár HUF-ban (csak ha status === 'Found')
 * @property {string} [currency]   - Mindig "HUF" az orchestrátor után
 * @property {string|null} [buyUrl]- Vásárlási link
 * @property {'Found'|'Not Found'|'Error'} status - Scraper eredmény státusza
 */

/**
 * Egy scraper Promise.allSettled eredményéből kinyeri az ajánlatot
 * és normalizálja a státuszt: 'Found' | 'Not Found' | 'Error'.
 *
 * @param {'fulfilled'|'rejected'} status
 * @param {*} value  - ha fulfilled
 * @param {*} reason - ha rejected (Error objektum, scraperStatus mezővel)
 * @param {string} storeName - megjelenítési név ha null értéket kaptunk
 * @returns {Offer|null}
 */
function extractOffer(status, value, reason, storeName) {
  if (status === 'fulfilled') {
    if (value === null || value === undefined) {
      // Scraper returned null → item simply not found
      return { store: storeName, status: 'Not Found' };
    }
    // Some scrapers throw an Error object as their "not found" signal
    if (value instanceof Error) {
      const s = value.scraperStatus || 'Not Found';
      return { store: storeName, status: s };
    }
    // Normal successful offer — ensure status field is present
    return { ...value, status: value.status || 'Found' };
  }

  // Rejected
  if (reason) {
    const scraperStatus = reason.scraperStatus || 'Error';
    return { store: storeName, status: scraperStatus };
  }
  return { store: storeName, status: 'Error' };
}

/**
 * Futtatja az összes releváns scrapért egy adott ISBN-re párhuzamosan.
 *
 * @param {Object} params
 * @param {string}  params.isbn        - A könyv ISBN száma
 * @param {boolean} [params.isManga]   - Ha igaz, manga-specifikus scrapereket futtat
 * @param {boolean} [params.isComic]   - Ha igaz, Walts scrapért is futtatja
 * @param {number}  [params.usdRate]   - USD→HUF árfolyam (opcionális)
 * @param {number}  [params.eurRate]   - EUR→HUF árfolyam (opcionális)
 * @returns {Promise<{ offers: Offer[], allRows: Offer[] }>}
 *   offers   — csak az érvényes (price > 0) ajánlatok, ár szerint rendezve
 *   allRows  — minden scraper eredménye (Found + Not Found + Error), a frontendnek
 */
export async function runScrapers({ isbn, isManga = false, isComic = false, usdRate = null, eurRate = null }) {
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

  // --- Árfolyamok ---
  const ratePromises = [
    usdRate !== null ? Promise.resolve(usdRate) : withTimeout((signal) => getUsdToHufRate(signal), DEFAULT_RATE_TIMEOUT_MS),
    eurRate !== null ? Promise.resolve(eurRate) : withTimeout((signal) => getEurToHufRate(signal), DEFAULT_RATE_TIMEOUT_MS),
  ];

  // --- Kategória-alapú scraper szűrés (Task C) ---
  // Ha MANGA: csak Walts, Amazon, Crunchyroll fut.
  // Ha COMIC (de nem manga): csak Walts fut a speciálisak közül.
  // Egyébként (könyv): Libri, Bookline, Libristo, ThriftBooks, BN futnak; Walts/Crunchyroll nem.

  const scraperPromises = [
    // BooksRun API — minden kategóriánál fut
    withTimeout(
      (signal) => axios.get(booksRunBuyUrl, {
        params: { key: process.env.BOOKSRUN_API_KEY },
        signal,
      }),
      DEFAULT_SCRAPER_TIMEOUT_MS
    ),

    // Libri — kihagyva manga esetén
    isManga
      ? Promise.resolve(null)
      : withTimeout((signal) => scrapeLibri(safeIsbn, signal), DEFAULT_SCRAPER_TIMEOUT_MS),

    // Bookline — kihagyva manga esetén
    isManga
      ? Promise.resolve(null)
      : withTimeout((signal) => scrapeBookline(safeIsbn, signal), DEFAULT_SCRAPER_TIMEOUT_MS),

    // Libristo — kihagyva manga esetén
    isManga
      ? Promise.resolve(null)
      : withTimeout((signal) => scrapeLibristo(safeIsbn, signal), DEFAULT_SCRAPER_TIMEOUT_MS),

    // Walts — futtatva mangánál ÉS kepregénynél
    (isComic || isManga)
      ? withTimeout((signal) => scrapeWalts(safeIsbn, signal), DEFAULT_SCRAPER_TIMEOUT_MS)
      : Promise.resolve(null),

    // Amazon — minden kategóriánál fut
    withTimeout((signal) => scrapeAmazon(safeIsbn, signal), DEFAULT_SCRAPER_TIMEOUT_MS),

    // Crunchyroll — csak mangánál (nem könyvnél, nem képregénynél)
    isManga
      ? withTimeout((signal) => scrapeCrunchyroll(safeIsbn, signal), DEFAULT_SCRAPER_TIMEOUT_MS)
      : Promise.resolve(null),

    // ThriftBooks — kihagyva manga esetén
    isManga
      ? Promise.resolve(null)
      : withTimeout((signal) => scrapeThriftBooks(safeIsbn, signal), DEFAULT_SCRAPER_TIMEOUT_MS),

    // Barnes & Noble — kihagyva manga esetén
    isManga
      ? Promise.resolve(null)
      : withTimeout((signal) => scrapeBarnesAndNoble(safeIsbn, signal), DEFAULT_SCRAPER_TIMEOUT_MS),

    ...ratePromises,
  ];

  const results = await Promise.allSettled(scraperPromises);

  const [
    booksRunRes, libriRes, booklineRes, libristoRes,
    waltsRes, amazonRes, crunchyrollRes, thriftRes, bnRes,
    usdRateRes, eurRateRes,
  ] = results;

  // Logolás
  const scraperNames = ['BooksRun', 'Libri', 'Bookline', 'Libristo', 'Walts', 'Amazon', 'Crunchyroll', 'ThriftBooks', 'BarnesAndNoble'];
  scraperNames.forEach((name, i) => {
    if (results[i].status === 'rejected') {
      // Pass user-controlled values (isbn) as separate arguments, not embedded in the format string
      console.warn('[Orchestrator]', name, 'scraper failed for ISBN', safeIsbn + ':', results[i].reason?.message || results[i].reason);
    }
  });

  const resolvedUsdRate = usdRateRes.status === 'fulfilled' ? usdRateRes.value : 360;
  const resolvedEurRate = eurRateRes.status === 'fulfilled' ? eurRateRes.value : 400;

  const offers = [];
  const allRows = []; // includes Not Found + Error rows for frontend display

  // ---- BooksRun (API) ----
  if (booksRunRes.status === 'fulfilled' && booksRunRes.value?.data?.result?.status === 'success') {
    const brData = booksRunRes.value.data.result.text;
    if (brData?.New?.price) {
      const row = {
        store: 'BooksRun',
        condition: 'New',
        price: convertToHuf(brData.New.price, resolvedUsdRate),
        currency: 'HUF',
        buyUrl: brData.New.cart_url || null,
        status: 'Found',
      };
      offers.push(row);
      allRows.push(row);
    }
    if (brData?.Used?.Good?.price) {
      const row = {
        store: 'BooksRun',
        condition: 'Used',
        price: convertToHuf(brData.Used.Good.price, resolvedUsdRate),
        currency: 'HUF',
        buyUrl: brData.Used.Good.cart_url || null,
        status: 'Found',
      };
      offers.push(row);
      allRows.push(row);
    }
  } else if (!isManga) {
    // Only show BooksRun status row for non-manga (it's an English-book API)
    const booksRunRow = extractOffer(booksRunRes.status, booksRunRes.value, booksRunRes.reason, 'BooksRun');
    if (booksRunRow) allRows.push(booksRunRow);
  }

  // ---- HUF scrapers (Libri, Bookline, Libristo) — skipped for manga ----
  const hufScrapers = [
    { res: libriRes, name: 'libri.hu' },
    { res: booklineRes, name: 'bookline.hu' },
    { res: libristoRes, name: 'Libristo' },
  ];

  for (const { res, name } of hufScrapers) {
    if (isManga) {
      // Skipped intentionally — do not add a status row for skipped scrapers
      continue;
    }
    const row = extractOffer(res.status, res.value, res.reason, name);
    if (row) {
      allRows.push(row);
      if (row.status === 'Found' && typeof row.price === 'number' && row.price > 0) {
        offers.push(row);
      }
    }
  }

  // ---- Walts (EUR) ----
  if (!isManga && !isComic) {
    // Not run for books — skip status row
  } else {
    const waltsRow = extractOffer(waltsRes.status, waltsRes.value, waltsRes.reason, 'Walts Comic Shop');
    if (waltsRow) {
      allRows.push(waltsRow);
      if (waltsRow.status === 'Found' && waltsRow.price) {
        const w = { ...waltsRow };
        if (w.currency === 'EUR') {
          w.price = convertToHuf(w.price, resolvedEurRate);
          w.currency = 'HUF';
        }
        offers.push(w);
      }
    }
  }

  // ---- Amazon (USD or EUR) — always runs ----
  const amazonRow = extractOffer(amazonRes.status, amazonRes.value, amazonRes.reason, 'Amazon');
  if (amazonRow) {
    allRows.push(amazonRow);
    if (amazonRow.status === 'Found' && amazonRow.price) {
      const a = { ...amazonRow };
      if (a.currency === 'USD') {
        a.price = convertToHuf(a.price, resolvedUsdRate);
        a.currency = 'HUF';
      } else if (a.currency === 'EUR') {
        a.price = convertToHuf(a.price, resolvedEurRate);
        a.currency = 'HUF';
      }
      offers.push(a);
    }
  }

  // ---- Crunchyroll (USD, manga only) ----
  if (isManga) {
    const crunchyRow = extractOffer(crunchyrollRes.status, crunchyrollRes.value, crunchyrollRes.reason, 'Crunchyroll');
    if (crunchyRow) {
      allRows.push(crunchyRow);
      if (crunchyRow.status === 'Found' && crunchyRow.price) {
        const c = { ...crunchyRow };
        if (c.currency === 'USD') {
          c.price = convertToHuf(c.price, resolvedUsdRate);
          c.currency = 'HUF';
        }
        offers.push(c);
      }
    }
  }

  // ---- ThriftBooks + Barnes & Noble (USD) — skipped for manga ----
  const usdScrapers = [
    { res: thriftRes, name: 'ThriftBooks' },
    { res: bnRes, name: 'BarnesAndNoble' },
  ];

  for (const { res, name } of usdScrapers) {
    if (isManga) continue;
    const row = extractOffer(res.status, res.value, res.reason, name);
    if (row) {
      allRows.push(row);
      if (row.status === 'Found' && row.price) {
        const d = { ...row };
        if (d.currency === 'USD') {
          d.price = convertToHuf(d.price, resolvedUsdRate);
          d.currency = 'HUF';
        }
        offers.push(d);
      }
    }
  }

  // Szűrés: csak érvényes (> 0) árak, rendezés legolcsóbbtól
  const validOffers = offers.filter(o => typeof o.price === 'number' && o.price > 0);
  validOffers.sort((a, b) => a.price - b.price);

  return {
    offers: validOffers,  // backward-compatible: sorted valid offers
    allRows,              // all rows including Not Found / Error for the frontend table
  };
}
