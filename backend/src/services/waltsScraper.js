import axios from 'axios';
import * as cheerio from 'cheerio';

export const scrapeWalts = async (isbn, signal) => {
  try {
    const searchUrl = `https://waltscomicshop.com/search?q=${isbn}`;

    let response;
    try {
      response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 12000,
        signal,
      });
    } catch (httpErr) {
      if (httpErr.response) {
        const status = httpErr.response.status;
        if (status >= 500 || status === 429 || status === 403) {
          const err = new Error(`Walts server error: HTTP ${status}`);
          err.scraperStatus = 'Error';
          throw err;
        }
        if (status === 404) return null;
      }
      throw httpErr;
    }

    const $ = cheerio.load(response.data);

    // Detect "no results" page
    const pageText = $('body').text().toLowerCase();
    if (
      pageText.includes('no products found') ||
      pageText.includes('your search returned no results') ||
      pageText.includes('0 results')
    ) {
      return null;
    }

    // Extended product container selectors
    const firstProduct = $(
      '.grid-product, .card-wrapper, .product-item, .product-card, [class*="product-tile"]'
    ).first();

    if (!firstProduct.length) return null;

    // Extended price selectors
    let priceText =
      firstProduct.find('.price__sale .price-item--sale').text().trim() ||
      firstProduct.find('[data-price]').attr('data-price') ||
      firstProduct.find('.product-card__price').text().trim() ||
      firstProduct.find('.price, .money, .product-item__price').text().trim();

    if (!priceText) {
      // Last resort: parse entire card text
      priceText = firstProduct.text();
    }

    // Link extraction
    let link = searchUrl;
    const aTag = firstProduct.find('a').first();
    if (aTag.length && aTag.attr('href')) {
      const href = aTag.attr('href');
      link = href.startsWith('http') ? href : `https://waltscomicshop.com${href}`;
    }

    // EUR amount — supports: €12.99 | 12.99€ | EUR 12.99 | 12,99€
    const priceMatch =
      priceText.match(/€\s*(\d+[,.]\d+)/) ||
      priceText.match(/(\d+[,.]\d+)\s*€/) ||
      priceText.match(/EUR\s*(\d+[,.]\d+)/) ||
      priceText.match(/(\d+[,.]\d+)\s*EUR/i);

    if (!priceMatch) return null;

    // Convert European decimal comma to dot
    const priceNumberStr = priceMatch[1].replace(',', '.');
    const price = parseFloat(priceNumberStr);

    if (isNaN(price) || price === 0) return null;

    return {
      store: 'Walts Comic Shop',
      condition: 'New',
      price,
      currency: 'EUR',
      buyUrl: link,
      status: 'Found',
    };

  } catch (err) {
    const wrapped = new Error(`Walts Comic Shop scraper error for ISBN ${isbn}: ${err.message}`);
    wrapped.scraperStatus = err.scraperStatus || 'Error';
    throw wrapped;
  }
};
