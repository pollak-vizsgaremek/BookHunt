import { launchStealthBrowser, configurePage, emulateHumanBehavior, emulateHumanScrolling, detectBotBlock } from '../utils/browserUtils.js';

export const scrapeCrunchyroll = async (isbn, signal) => {
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
    await configurePage(page, 'Crunchyroll');

    await emulateHumanBehavior(page, 'Crunchyroll');

    const searchUrl = `https://store.crunchyroll.com/search?q=${isbn}`;
    let pageResponse;
    try {
      pageResponse = await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (navErr) {
      throw Object.assign(new Error(`Crunchyroll navigation failed: ${navErr.message}`), { scraperStatus: 'Error' });
    }

    if (pageResponse) {
      const httpStatus = pageResponse.status();
      if (httpStatus >= 500 || httpStatus === 403 || httpStatus === 429) {
        throw Object.assign(
          new Error(`Crunchyroll returned HTTP ${httpStatus}`),
          { scraperStatus: 'Error' }
        );
      }
    }

    detectBotBlock(await page.title(), 'Crunchyroll');

    await page
      .waitForSelector(
        '.product-tile, .sales .value, [class*="product-tile"], .css-13o7eu2',
        { timeout: 10000 }
      )
      .catch(() => {});

    await emulateHumanScrolling(page, 'Crunchyroll');

    const data = await page.evaluate(() => {
      // No-results detection
      const bodyText = (document.body.innerText || '').toLowerCase();
      if (
        bodyText.includes('no results') ||
        bodyText.includes('0 results') ||
        bodyText.includes("we couldn't find")
      ) {
        return { notFound: true };
      }

      // Product tile selectors (Crunchyroll Store uses SFCC / custom CSS)
      const productTile = document.querySelector(
        '.product-tile, div[class*="product-tile"], .css-13o7eu2, [data-cmp="productTile"], .c-product-tile'
      );
      if (!productTile) return { notFound: true };

      // Price selectors
      const priceElem = productTile.querySelector(
        '.sales .value, span[class*="price"], .css-1b42z33, [data-price], .price-sales'
      );
      let link = window.location.href;

      const linkElem = productTile.querySelector('a.link, a[class*="product-link"], a');
      if (linkElem && linkElem.href) link = linkElem.href;

      return {
        priceText: priceElem ? priceElem.textContent.trim() : '',
        link,
      };
    });

    if (!data || data.notFound) return null;
    if (!data.priceText) return null;

    const { priceText, link } = data;
    const numMatch = priceText.match(/[\d.]+/);
    if (!numMatch) return null;

    const price = parseFloat(numMatch[0]);
    if (isNaN(price) || price === 0) return null;

    return {
      store: 'Crunchyroll',
      condition: 'New',
      price,
      currency: 'USD',
      buyUrl: link,
      status: 'Found',
    };

  } catch (err) {
    if (signal?.aborted) throw new Error(`Crunchyroll scraper aborted for ISBN ${isbn}`);
    const wrapped = new Error(`Crunchyroll scraper error for ISBN ${isbn}: ${err.message}`);
    wrapped.scraperStatus = err.scraperStatus || 'Error';
    throw wrapped;
  } finally {
    if (signal) signal.removeEventListener('abort', onAbort);
    if (browser) await browser.close();
  }
};
