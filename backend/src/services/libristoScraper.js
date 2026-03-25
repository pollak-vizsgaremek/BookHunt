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
    const searchUrl = `https://www.libristo.hu/hu/kereses?t=${isbn}`;
    
    // Go to the search URL, wait until the DOM is loaded
    await page.goto(searchUrl, { waitUntil: 'load', timeout: 12000 });
    
    // Cookiebot bypass
    try {
      await page.waitForFunction(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        return buttons.find(b => b.innerText.includes('Értem') || b.innerText.includes('Accept') || b.id === 'CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll');
      }, { timeout: 5000 });
      
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        const btn = buttons.find(b => b.innerText.includes('Értem') || b.innerText.includes('Accept') || b.id === 'CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll');
        if (btn) btn.click();
      });
      // wait a bit for react rendering
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      // Cookiebot not found or already accepted
    }
    
    // Evaluate page content to find the price and product URL
    const data = await page.evaluate(() => {
      // Find the first product link in search results, if any
      const productSelector = 'a.font-heading, a.product-title, a.book-title, .product a, .item a, .c-product__title';
      const firstProductLink = document.querySelector(productSelector);
      
      // Look for specific price element from browser investigation
      const priceElement = document.querySelector('span.text-5xl.font-bold.text-black, span.text-sm.font-bold.text-black, .price, .product-price, .c-price');
      
      if (!priceElement) {
        // Log all text to help debugging
        return { error: 'Price element not found', html: document.body.innerText.substring(0, 500) };
      }
      
      let priceText = priceElement.innerText || priceElement.textContent;
      
      let link = window.location.href; // Default to current URL if it redirected
      if (firstProductLink && firstProductLink.href) {
        link = firstProductLink.href;
      }
      
      return { priceText, link };
    });
    
    if (!data || data.error || !data.priceText) {
      console.log(`[Libristo Debug] Evaluation failed: ${data?.error || 'No priceText'}`);
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
