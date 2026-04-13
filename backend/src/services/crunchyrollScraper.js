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
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
    
    detectBotBlock(await page.title(), 'Crunchyroll');
    
    await page.waitForSelector('.product-tile, .sales .value', { timeout: 10000 }).catch(() => {});
    
    await emulateHumanScrolling(page, 'Crunchyroll');
    
    const data = await page.evaluate(() => {
      const productTile = document.querySelector('.product-tile, div[class*="product-tile"], .css-13o7eu2');
      if (!productTile) return null;
      
      const priceElem = productTile.querySelector('.sales .value, span[class*="price"], .css-1b42z33');
      let link = window.location.href;
      
      const linkElem = productTile.querySelector('a.link, a[class*="product-link"], a');
      if (linkElem && linkElem.href) {
        link = linkElem.href;
      }
      
      return { 
        priceText: priceElem ? priceElem.textContent.trim() : '', 
        link 
      };
    });

    if (!data || !data.priceText) return null;
    
    const { priceText, link } = data;
    const numMatch = priceText.match(/[\d.]+/);
    if (!numMatch) return null;
    
    const price = parseFloat(numMatch[0]);
    if (isNaN(price) || price === 0) return null;

    return {
      store: 'Crunchyroll',
      condition: 'New',
      price: price,
      currency: 'USD',
      buyUrl: link
    };
    
  } catch (err) {
    if (signal?.aborted) throw new Error(`Crunchyroll scraper aborted for ISBN ${isbn}`);
    throw new Error(`Crunchyroll scraper error for ISBN ${isbn}: ${err.message}`);
  } finally {
    if (signal) signal.removeEventListener('abort', onAbort);
    if (browser) await browser.close();
  }
};
