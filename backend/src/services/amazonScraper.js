import { launchStealthBrowser, configurePage, emulateHumanBehavior, emulateHumanScrolling, detectBotBlock } from '../utils/browserUtils.js';

export const scrapeAmazon = async (isbn, signal) => {
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
    await configurePage(page, 'Amazon');
    
    await emulateHumanBehavior(page, 'Amazon');
    
    const searchUrl = `https://www.amazon.com/s?k=${isbn}`;
    
    let pageResponse;
    try {
      pageResponse = await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 15000 });
    } catch (navErr) {
      throw Object.assign(new Error(`Amazon navigation failed: ${navErr.message}`), { scraperStatus: 'Error' });
    }

    // Detect hard HTTP error codes (rate-limit, server error, etc.)
    if (pageResponse) {
      const httpStatus = pageResponse.status();
      if (httpStatus === 503 || httpStatus === 429 || httpStatus === 451) {
        throw Object.assign(
          new Error(`Amazon returned HTTP ${httpStatus} for ISBN ${isbn}`),
          { scraperStatus: 'Error' }
        );
      }
    }
    
    const pageTitle = await page.title();
    detectBotBlock(pageTitle, 'Amazon');
    
    // If Amazon is showing a CAPTCHA / robot check page
    if (pageTitle.toLowerCase().includes('robot') || pageTitle.toLowerCase().includes('captcha')) {
      throw Object.assign(new Error('Amazon bot-block detected'), { scraperStatus: 'Error' });
    }
    
    await emulateHumanScrolling(page, 'Amazon');
    
    const data = await page.evaluate(() => {
      // Modern Amazon search result containers (multiple selectors for resilience)
      const containers = [
        ...document.querySelectorAll('[data-asin]:not([data-asin=""])'),
        ...document.querySelectorAll('[data-component-type="s-search-result"]'),
        ...document.querySelectorAll('div[data-cy="asin-faceout-container"]'),
        ...document.querySelectorAll('.s-result-item[data-index]'),
      ];

      // Filter to first real product container
      const targetResult = containers.find(el => {
        const asin = el.getAttribute('data-asin');
        return asin && asin.length > 0 && !el.classList.contains('AdHolder');
      }) || containers[0];

      if (!targetResult) return { notFound: true };

      // Check availability — "Currently unavailable" signals "Not Found"
      const wholeText = (targetResult.innerText || '').toLowerCase();
      if (wholeText.includes('currently unavailable') || wholeText.includes('not available')) {
        return { notFound: true };
      }

      // Price extraction — try structured elements first, then offscreen
      const priceWholeElem   = targetResult.querySelector('.a-price-whole');
      const priceFractionElem = targetResult.querySelector('.a-price-fraction');
      const symbolElem       = targetResult.querySelector('.a-price-symbol');
      const offscreenElem    = targetResult.querySelector('.a-price .a-offscreen');

      let priceText = '';
      if (priceWholeElem && priceFractionElem) {
        priceText = (symbolElem ? symbolElem.textContent : '') +
                    priceWholeElem.textContent +
                    priceFractionElem.textContent;
      } else if (offscreenElem) {
        priceText = offscreenElem.textContent;
      }

      // Link extraction
      let link = window.location.href;
      const linkElem = targetResult.querySelector(
        'h2 a.a-link-normal, a.a-link-normal.s-no-outline, a[data-asin]'
      );
      if (linkElem && linkElem.href) link = linkElem.href;

      return { priceText, link };
    });
    
    // Book not listed on Amazon for this ISBN
    if (!data || data.notFound || !data.priceText) {
      return Object.assign(new Error(`Amazon: item not found for ISBN ${isbn}`), { scraperStatus: 'Not Found' });
    }
    
    const { priceText, link } = data;
    const numMatch = priceText.match(/[\d,.]+/);
    if (!numMatch) {
      return Object.assign(new Error(`Amazon: could not parse price for ISBN ${isbn}`), { scraperStatus: 'Not Found' });
    }
    
    let priceNumberStr = numMatch[0];
    let currency = 'USD';
    if (priceText.includes('HUF') || priceText.includes('Ft')) {
      currency = 'HUF';
      priceNumberStr = priceNumberStr.replace(/,/g, '');
    } else if (priceText.includes('€') || priceText.includes('EUR')) {
      currency = 'EUR';
      priceNumberStr = priceNumberStr.replace(/,/g, '.');
    } else {
      priceNumberStr = priceNumberStr.replace(/,/g, '');
    }
    
    const price = parseFloat(priceNumberStr);
    if (isNaN(price) || price === 0) return null;

    return {
      store: 'Amazon',
      condition: 'New',
      price,
      currency,
      buyUrl: link,
      status: 'Found',
    };
    
  } catch (err) {
    if (signal?.aborted) throw new Error(`Amazon scraper aborted for ISBN ${isbn}`);
    // Re-attach scraperStatus if already set, otherwise generic error
    const statusErr = new Error(`Amazon scraper error for ISBN ${isbn}: ${err.message}`);
    statusErr.scraperStatus = err.scraperStatus || 'Error';
    throw statusErr;
  } finally {
    if (signal) signal.removeEventListener('abort', onAbort);
    if (browser) await browser.close();
  }
};
