import puppeteer from 'puppeteer';
import fs from 'fs';

export const scrapeLibristo = async (isbn) => {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-blink-features=AutomationControlled'
      ]
    });
    
    const page = await browser.newPage();
    // Spoof User-Agent to avoid basic bot blocks
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
       'Accept-Language': 'hu-HU,hu;q=0.9,en-US;q=0.8,en;q=0.7'
    });
    
    // Navigate to Libristo search page
    const searchUrl = `https://www.libristo.hu/hu/kereses?q=${isbn}`;
    
    // Go to the search URL, wait until the DOM is loaded
    await page.goto(searchUrl, { waitUntil: 'load', timeout: 30000 });
    
    // Cookiebot bypass
    try {
      await page.waitForSelector('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll', { timeout: 3000 });
      await page.click('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll');
      // wait a bit for react rendering
      await page.waitForTimeout(1000); 
    } catch (e) {
      // Cookiebot not found or already accepted
    }
    
    // Evaluate page content to find the price and product URL
    const data = await page.evaluate(() => {
      // Find the first product link in search results, if any
      const productSelector = 'a.product-title, a.book-title, .product a, .item a, .c-product__title';
      const firstProductLink = document.querySelector(productSelector);
      
      // Look for any price element
      const priceElement = document.querySelector('.price, .product-price, strong, .c-price');
      
      if (!priceElement) return null;
      
      let priceText = priceElement.innerText || priceElement.textContent;
      
      let link = window.location.href; // Default to current URL if it redirected
      if (firstProductLink && firstProductLink.href) {
        link = firstProductLink.href;
      }
      
      return { priceText, link };
    });
    
    if (!data || !data.priceText) {
      return null;
    }
    
    const { priceText, link } = data;
    
    // Remove spaces, non-breaking spaces, and extract the number
    const priceMatch = priceText.replace(/\s+/g, '').replace(/&nbsp;/g, '').replace(/Ft/gi, '').match(/\d+/);
    if (!priceMatch) {
      return null;
    }
    
    const price = parseInt(priceMatch[0], 10);
    
    // Safety check - if price is 0 or NaN, ignore
    if (isNaN(price) || price === 0) {
        return null;
    }

    return {
      store: 'libristo.hu',
      condition: 'New',
      price: price,
      currency: 'HUF',
      buyUrl: link
    };
    
  } catch (err) {
    console.error(`Libristo scraper error for ISBN ${isbn} using Puppeteer:`, err.message);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
