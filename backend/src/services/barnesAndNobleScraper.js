import { launchStealthBrowser, configurePage, emulateHumanBehavior, emulateHumanScrolling, detectBotBlock, releaseBrowserSlot } from '../utils/browserUtils.js';

export const scrapeBarnesAndNoble = async (isbn, signal) => {
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
    await configurePage(page, 'B&N');

    // Organic-traffic referer — sites are less suspicious of Google-referred visits
    await page.setExtraHTTPHeaders({ 'Referer': 'https://www.google.com/' });
    await emulateHumanBehavior(page, 'B&N');

    // Try direct product URL by EAN/ISBN first — more reliable than search page
    const directUrl = `https://www.barnesandnoble.com/w/?ean=${isbn}`;
    const searchUrl = `https://www.barnesandnoble.com/s/${isbn}`;

    let pageResponse;
    let usedUrl = directUrl;
    try {
      pageResponse = await page.goto(directUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (navErr) {
      throw Object.assign(new Error(`B&N navigation failed: ${navErr.message}`), { scraperStatus: 'Error' });
    }

    // On 403 — wait 3 s then retry with the search URL
    if (pageResponse && pageResponse.status() === 403) {
      await new Promise(r => setTimeout(r, 3000));
      usedUrl = searchUrl;
      try {
        pageResponse = await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      } catch (navErr) {
        throw Object.assign(new Error(`B&N retry navigation failed: ${navErr.message}`), { scraperStatus: 'Error' });
      }
    }

    // HTTP error detection
    if (pageResponse) {
      const httpStatus = pageResponse.status();
      if (httpStatus === 403 || httpStatus === 451 || httpStatus === 503 || httpStatus === 429) {
        throw Object.assign(
          new Error(`Barnes & Noble returned HTTP ${httpStatus}`),
          { scraperStatus: 'Error' }
        );
      }
    }

    const pageTitle = await page.title();
    detectBotBlock(pageTitle, 'Barnes & Noble');

    // Wait for any known price selector — don't hard-fail if not found
    await page
      .waitForSelector(
        '.product-shelf-info, .current-price, .cat-buybox__price, [data-testid="priceDisplay"], .product-list-item',
        { timeout: 12000 }
      )
      .catch(() => {});

    await emulateHumanScrolling(page, 'B&N');

    const data = await page.evaluate((isbnSearch) => {
      const bodyText = (document.body.innerText || '').toLowerCase();
      if (
        bodyText.includes('no results') ||
        bodyText.includes('0 results') ||
        bodyText.includes("we couldn't find")
      ) {
        return { notFound: true };
      }

      const directSelectors = [
        '[data-testid="priceDisplay"]',
        '.cat-buybox__price .format__list-price',
        '.cat-buybox__price',
        '.current-price',
        '.sale-price',
        "span[itemprop='price']",
        '.product-price',
      ];

      for (const sel of directSelectors) {
        const el = document.querySelector(sel);
        if (el && el.innerText.trim()) {
          return { priceText: el.innerText.trim(), link: window.location.href };
        }
      }

      const results = Array.from(
        document.querySelectorAll('.product-shelf-info, .product-list-item')
      );
      const targetResult =
        results.find((el) => el.innerText.replace(/-/g, '').includes(isbnSearch)) || results[0];

      if (!targetResult) return { notFound: true };

      const priceElem = targetResult.querySelector(
        '[data-testid="priceDisplay"], .current-price, .cat-buybox__price, .price'
      );
      let link = window.location.href;
      const linkElem = targetResult.querySelector('a');
      if (linkElem && linkElem.href) link = linkElem.href;

      return { priceText: priceElem ? priceElem.innerText.trim() : '', link };
    }, isbn);

    if (!data || data.notFound) return null;
    if (!data.priceText) return null;

    const { priceText } = data;
    const link = data.link || usedUrl;
    const numMatch = priceText.match(/[\d.]+/);
    if (!numMatch) return null;

    const price = parseFloat(numMatch[0]);
    if (isNaN(price) || price === 0) return null;

    return {
      store: 'BarnesAndNoble',
      condition: 'New',
      price,
      currency: 'USD',
      buyUrl: link,
      status: 'Found',
    };
  } catch (err) {
    if (signal?.aborted) throw new Error(`BarnesAndNoble scraper aborted for ISBN ${isbn}`);
    const wrapped = new Error(`BarnesAndNoble scraper error for ISBN ${isbn}: ${err.message}`);
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
