import { launchStealthBrowser, configurePage, emulateHumanBehavior, emulateHumanScrolling, detectBotBlock, releaseBrowserSlot } from '../utils/browserUtils.js';

export const scrapeThriftBooks = async (isbn, signal) => {
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
    await configurePage(page, 'ThriftBooks');

    await emulateHumanBehavior(page, 'ThriftBooks');

    const searchUrl = `https://www.thriftbooks.com/browse/?b.search=${isbn}`;
    let pageResponse;
    try {
      pageResponse = await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (navErr) {
      throw Object.assign(new Error(`ThriftBooks navigation failed: ${navErr.message}`), { scraperStatus: 'Error' });
    }

    // HTTP error detection
    if (pageResponse) {
      const httpStatus = pageResponse.status();
      if (httpStatus === 403 || httpStatus === 503 || httpStatus === 429) {
        throw Object.assign(
          new Error(`ThriftBooks returned HTTP ${httpStatus}`),
          { scraperStatus: 'Error' }
        );
      }
    }

    detectBotBlock(await page.title(), 'ThriftBooks');

    await page
      .waitForSelector(
        '.SearchResultGridItem, .AllEditionsItem, .book-price, [data-qa="book-price"], .Recommendations_recommendations__NP7Kx',
        { timeout: 12000 }
      )
      .catch(() => {});

    await emulateHumanScrolling(page, 'ThriftBooks');

    const data = await page.evaluate(() => {
      // Detect "no results" page
      const bodyText = (document.body.innerText || '').toLowerCase();
      if (
        bodyText.includes('no results found') ||
        bodyText.includes("we couldn't find any") ||
        bodyText.includes('0 results')
      ) {
        return { notFound: true };
      }

      // Direct price selectors (most specific first)
      const directSelectors = [
        '[data-qa="book-price"]',
        '.book-detail__price',
        '.book-price .price',
        '.UsedPriceBlock-price',
      ];

      for (const sel of directSelectors) {
        const el = document.querySelector(sel);
        if (el && el.innerText.trim()) {
          return { priceText: el.innerText.trim(), link: window.location.href };
        }
      }

      // Search result grid fallback
      const results = Array.from(
        document.querySelectorAll(
          '.SearchResultGridItem, .AllEditionsItem, .Recommendations_recommendations__NP7Kx article'
        )
      );
      const targetResult = results[0];
      if (!targetResult) return { notFound: true };

      const priceElem = targetResult.querySelector(
        '[data-qa="book-price"], .SearchResultListItem-price, .AllEditionsItem-price, .book-price'
      );
      let link = window.location.href;
      const linkElem = targetResult.querySelector('a');
      if (linkElem && linkElem.href) link = linkElem.href;

      return { priceText: priceElem ? priceElem.innerText.trim() : '', link };
    });

    if (!data || data.notFound) return null;
    if (!data.priceText) return null;

    const { priceText, link } = data;
    const numMatch = priceText.match(/[\d.]+/);
    if (!numMatch) return null;

    const price = parseFloat(numMatch[0]);
    if (isNaN(price) || price === 0) return null;

    return {
      store: 'ThriftBooks',
      condition: 'Used',
      price,
      currency: 'USD',
      buyUrl: link,
      status: 'Found',
    };
  } catch (err) {
    if (signal?.aborted) throw new Error(`ThriftBooks scraper aborted for ISBN ${isbn}`);
    const wrapped = new Error(`ThriftBooks scraper error for ISBN ${isbn}: ${err.message}`);
    wrapped.scraperStatus = err.scraperStatus || 'Error';
    throw wrapped;
  } finally {
    if (signal) signal.removeEventListener('abort', onAbort);
    if (browser) {
      await browser.close().catch(() => {});
      releaseBrowserSlot();
    }
  }
};
