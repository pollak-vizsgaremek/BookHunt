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
    await page.goto(searchUrl, { waitUntil: 'load', timeout: 12000 });
    
    detectBotBlock(await page.title(), 'Libristo');
    
    try {
      const cookieButton = await page.$('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll');
      if (cookieButton) {
        await cookieButton.click();
      }
    } catch (e) {
      // Cookiebot not found or already accepted
    }
    
    await emulateHumanScrolling(page, 'Libristo');
    
    const data = await page.evaluate(() => {
      const targetResult = document.querySelector('.product-box');
      if (!targetResult) return null;
      
      const priceElem = targetResult.querySelector('.price span, .price');
      let link = window.location.href;
      const linkElem = targetResult.querySelector('a.product-link, a');
      if (linkElem && linkElem.href) {
        link = linkElem.href;
      }
      return { priceText: priceElem ? priceElem.textContent.trim() : '', link };
    });

    if (!data || !data.priceText) return null;

    const { priceText, link } = data;
    const cleanPriceText = priceText.replace(/\s/g, '').replace(/Ft|HUF/gi, '');
    const numMatch = cleanPriceText.match(/\d+/);
    if (!numMatch) return null;

    const price = parseInt(numMatch[0], 10);
    if (isNaN(price) || price === 0) return null;

    return {
      store: 'Libristo',
      condition: 'New',
      price: price,
      currency: 'HUF',
      buyUrl: link
    };

  } catch (err) {
    if (signal?.aborted) throw new Error(`Libristo scraper aborted for ISBN ${isbn}`);
    throw new Error(`Libristo scraper error for ISBN ${isbn}: ${err.message}`);
  } finally {
    if (signal) signal.removeEventListener('abort', onAbort);
    if (browser) await browser.close();
  }
};
