import { launchStealthBrowser, configurePage, emulateHumanBehavior, emulateHumanScrolling, detectBotBlock } from '../utils/browserUtils.js';

export const scrapeLibristo = async (isbn, signal) => {
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
    await configurePage(page, 'Libristo');

    await emulateHumanBehavior(page, 'Libristo');

    const searchUrl = `https://www.libristo.hu/hu/kereses?t=${isbn}`;
    let pageResponse;
    try {
      pageResponse = await page.goto(searchUrl, { waitUntil: 'load', timeout: 15000 });
    } catch (navErr) {
      throw Object.assign(new Error(`Libristo navigation failed: ${navErr.message}`), { scraperStatus: 'Error' });
    }

    // HTTP error detection
    if (pageResponse) {
      const httpStatus = pageResponse.status();
      if (httpStatus >= 500 || httpStatus === 403 || httpStatus === 429) {
        throw Object.assign(
          new Error(`Libristo returned HTTP ${httpStatus}`),
          { scraperStatus: 'Error' }
        );
      }
    }

    detectBotBlock(await page.title(), 'Libristo');

    // Dismiss Cookiebot consent dialog — try multiple known button selectors
    try {
      const cookieSelectors = [
        '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
        '#CybotCookiebotDialogBodyButtonAccept',
        'button[data-culture="hu"][id*="Allow"]',
        '.CybotCookiebotDialogBodyButton',
      ];
      for (const sel of cookieSelectors) {
        const btn = await page.$(sel);
        if (btn) {
          await btn.click();
          break;
        }
      }
    } catch (_e) {
      // Cookie dialog not found or already accepted — safe to ignore
    }

    await emulateHumanScrolling(page, 'Libristo');

    const data = await page.evaluate(() => {
      // Detect "no results" page
      const bodyText = (document.body.innerText || '').toLowerCase();
      if (
        bodyText.includes('nenašli jsme') || // Czech fallback
        bodyText.includes('nem található') ||
        bodyText.includes('nincs találat') ||
        bodyText.includes('0 termék')
      ) {
        return { notFound: true };
      }

      // Extended product container selectors
      const targetResult = document.querySelector(
        '.product-box, .categoryItem, .product-block, .productCard, article.product'
      );
      if (!targetResult) return { notFound: true };

      // Price selectors
      const priceElem = targetResult.querySelector(
        '.price span, .price, .productPrice, [class*="price"], [data-price]'
      );
      let link = window.location.href;
      const linkElem = targetResult.querySelector('a.product-link, a');
      if (linkElem && linkElem.href) link = linkElem.href;

      return { priceText: priceElem ? priceElem.textContent.trim() : '', link };
    });

    if (!data || data.notFound) return null;
    if (!data.priceText) return null;

    const { priceText, link } = data;
    const cleanPriceText = priceText.replace(/\s/g, '').replace(/Ft|HUF/gi, '');
    const numMatch = cleanPriceText.match(/\d+/);
    if (!numMatch) return null;

    const price = parseInt(numMatch[0], 10);
    if (isNaN(price) || price === 0) return null;

    return {
      store: 'Libristo',
      condition: 'New',
      price,
      currency: 'HUF',
      buyUrl: link,
      status: 'Found',
    };

  } catch (err) {
    if (signal?.aborted) throw new Error(`Libristo scraper aborted for ISBN ${isbn}`);
    const wrapped = new Error(`Libristo scraper error for ISBN ${isbn}: ${err.message}`);
    wrapped.scraperStatus = err.scraperStatus || 'Error';
    throw wrapped;
  } finally {
    if (signal) signal.removeEventListener('abort', onAbort);
    if (browser) await browser.close();
  }
};
