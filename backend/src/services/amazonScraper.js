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
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 12000 });
    
    detectBotBlock(await page.title(), 'Amazon');
    
    await emulateHumanScrolling(page, 'Amazon');
    
    const data = await page.evaluate(() => {
      let targetResult = document.querySelector('div[data-cy="asin-faceout-container"], div[data-cel-widget^="MAIN-SEARCH_RESULTS"], div[data-component-type="s-search-result"], .s-result-item');
      if (!targetResult) return null;
      
      const priceWholeElem = targetResult.querySelector('.a-price-whole');
      const priceFractionElem = targetResult.querySelector('.a-price-fraction');
      const symbolElem = targetResult.querySelector('.a-price-symbol');
      
      let priceText = '';
      if (priceWholeElem && priceFractionElem) {
        priceText = (symbolElem ? symbolElem.textContent : '') + priceWholeElem.textContent + priceFractionElem.textContent;
      } else {
        const rawPriceElem = targetResult.querySelector('.a-price .a-offscreen');
        if (rawPriceElem) {
            priceText = rawPriceElem.textContent;
        }
      }
      
      let link = window.location.href;
      const linkElem = targetResult.querySelector('a.a-link-normal.s-no-outline, h2 a.a-link-normal');
      if (linkElem && linkElem.href) {
        link = linkElem.href;
      }
      return { priceText, link };
    });
    
    if (!data || !data.priceText) return null;
    
    const { priceText, link } = data;
    const numMatch = priceText.match(/[\d,.]+/);
    if (!numMatch) return null;
    
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
      price: price,
      currency: currency,
      buyUrl: link
    };
    
  } catch (err) {
    if (signal?.aborted) throw new Error(`Amazon scraper aborted for ISBN ${isbn}`);
    throw new Error(`Amazon scraper error for ISBN ${isbn}: ${err.message}`);
  } finally {
    if (signal) signal.removeEventListener('abort', onAbort);
    if (browser) await browser.close();
  }
};
