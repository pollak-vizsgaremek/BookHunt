import { politeScraper, delay } from './scraper.js';
import * as cheerio from 'cheerio';

export const scrapeBookline = async (isbn, signal) => {
  try {
    // Polite random delay (1–3 s)
    await delay(1000 + Math.random() * 2000);

    // Bookline auto-redirects to the product page if ISBN matches exactly
    const searchUrl = `https://bookline.hu/search/search.action?searchfield=${isbn}`;
    let response;
    try {
      response = await politeScraper.get(searchUrl, { signal });
    } catch (httpErr) {
      if (httpErr.response && httpErr.response.status >= 500) {
        const err = new Error(`Bookline server error: HTTP ${httpErr.response.status}`);
        err.scraperStatus = 'Error';
        throw err;
      }
      throw httpErr;
    }

    const $ = cheerio.load(response.data);

    // Detect "no results" / soft-404 page
    const pageText = $('body').text().toLowerCase();
    const noResults =
      pageText.includes('nem található') ||
      pageText.includes('nincs találat') ||
      pageText.includes('0 találat') ||
      $('.empty-resultset, .no-results, .search-norslt').length > 0;

    if (noResults) return null;

    // Extended price selector chain
    const priceText =
      $('.o-product-prices .price').first().text().trim() ||
      $('.product-detail-price').first().text().trim() ||
      $('.price-box__price').first().text().trim() ||
      $('.price').first().text().trim();

    if (!priceText) return null;

    // Strip whitespace and extract leading digit sequence (handles "5 841 Ft")
    const cleaned = priceText.replace(/\s+/g, '').replace(/Ft|HUF/gi, '');
    const priceMatch = cleaned.match(/\d+/);
    if (!priceMatch) return null;

    const price = parseInt(priceMatch[0], 10);
    if (isNaN(price) || price === 0) return null;

    // Final URL after potential redirect
    const finalUrl = response.request?.res?.responseUrl || searchUrl;

    return {
      store: 'bookline.hu',
      condition: 'New',
      price,
      currency: 'HUF',
      buyUrl: finalUrl,
      status: 'Found',
    };
  } catch (error) {
    const wrapped = new Error(`Bookline scraper error for ISBN ${isbn}: ${error.message}`);
    wrapped.scraperStatus = error.scraperStatus || 'Error';
    throw wrapped;
  }
};
