import { launchStealthBrowser, configurePage, emulateHumanBehavior, emulateHumanScrolling, detectBotBlock } from '../utils/browserUtils.js';

/**
 * libriScraper.js
 *
 * Switched from plain Axios to the stealth Puppeteer browser to avoid Libri's
 * 403 Forbidden bot-detection (which flags the static Axios user-agent).
 * Keeps the same ISBN → product URL logic (direct URL first, search fallback).
 */
export const scrapeLibri = async (isbn, signal) => {
  let browser = null;

  const onAbort = async () => {
    if (browser) await browser.close();
  };

  if (signal) {
    if (signal.aborted) throw new Error('Aborted');
    signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    browser = await launchStealthBrowser();
    const page = await browser.newPage();
    await configurePage(page, 'Libri');
    await emulateHumanBehavior(page, 'Libri');

    // ---- Step 1: Try direct ISBN URL ----
    const directUrl = `https://www.libri.hu/konyv/isbn/${isbn}.html`;
    let pageResponse;
    try {
      pageResponse = await page.goto(directUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (navErr) {
      throw Object.assign(new Error(`Libri navigation failed: ${navErr.message}`), { scraperStatus: 'Error' });
    }

    if (pageResponse) {
      const httpStatus = pageResponse.status();
      if (httpStatus >= 500 || httpStatus === 429) {
        throw Object.assign(new Error(`Libri server error: HTTP ${httpStatus}`), { scraperStatus: 'Error' });
      }
    }

    detectBotBlock(await page.title(), 'Libri');
    await emulateHumanScrolling(page, 'Libri');

    // ---- Step 2: Try to read price from current page ----
    let finalUrl = directUrl;
    let priceText = await page.evaluate(() => {
      // Detect soft-404 / "not found" page
      const bodyText = (document.body.innerText || '').toLowerCase();
      if (bodyText.includes('nem található') || bodyText.includes('az oldal nem létezik')) {
        return null; // signals soft-404
      }
      const selectors = [
        '.online',
        '.price-block__price',
        '.webshop-price',
        '.book-price',
        '.price-holder',
        '.discount-price',
        '.price',
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && el.textContent.trim()) return el.textContent.trim();
      }
      return null;
    });

    // ---- Step 3: Fallback to search if direct URL gave nothing ----
    if (!priceText) {
      const searchUrl = `https://www.libri.hu/talalati_lista/?text=${isbn}`;
      let searchResponse;
      try {
        searchResponse = await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      } catch (navErr) {
        throw Object.assign(new Error(`Libri search navigation failed: ${navErr.message}`), { scraperStatus: 'Error' });
      }
      if (searchResponse) {
        const httpStatus = searchResponse.status();
        if (httpStatus >= 500) {
          throw Object.assign(new Error(`Libri search server error: HTTP ${httpStatus}`), { scraperStatus: 'Error' });
        }
      }
      detectBotBlock(await page.title(), 'Libri');

      // Find first book link and navigate to it
      const firstBookHref = await page.evaluate(() => {
        // Detect no-results page
        const bodyText = (document.body.innerText || '').toLowerCase();
        if (bodyText.includes('nincs találat') || bodyText.includes('0 találat')) return '__not_found__';
        const links = Array.from(document.querySelectorAll('a[href*="/konyv/"]'));
        const bookLink = links.find(a => !a.href.includes('talalati_lista'));
        return bookLink ? bookLink.href : null;
      });

      if (!firstBookHref || firstBookHref === '__not_found__') return null;

      finalUrl = firstBookHref;
      await page.goto(finalUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await emulateHumanScrolling(page, 'Libri');

      priceText = await page.evaluate(() => {
        const selectors = ['.online', '.price-block__price', '.webshop-price', '.book-price', '.price-holder', '.discount-price', '.price'];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent.trim()) return el.textContent.trim();
        }
        return null;
      });
    }

    if (!priceText) {
      console.log(`[Libri Debug] No priceText found on URL: ${finalUrl}`);
      return null;
    }

    // Parse Hungarian price — strip whitespace, "Ft"/"HUF", then extract digits
    const cleaned = priceText.replace(/\s+/g, '').replace(/Ft|HUF/gi, '');
    const priceMatch = cleaned.match(/\d+/);
    if (!priceMatch) {
      console.log(`[Libri Debug] Regex failed on priceText: ${priceText}`);
      return null;
    }

    const price = parseInt(priceMatch[0], 10);
    if (isNaN(price) || price === 0) return null;

    return {
      store:     'libri.hu',
      condition: 'New',
      price,
      currency:  'HUF',
      buyUrl:    finalUrl,
      status:    'Found',
    };

  } catch (err) {
    if (signal?.aborted) throw new Error(`Libri scraper aborted for ISBN ${isbn}`);
    const wrapped = new Error(`Libri scraper error for ISBN ${isbn}: ${err.message}`);
    wrapped.scraperStatus = err.scraperStatus || 'Error';
    throw wrapped;
  } finally {
    if (signal) signal.removeEventListener('abort', onAbort);
    if (browser) await browser.close();
  }
};
