import puppeteer from 'puppeteer';

export const scrapeAmazon = async (isbn) => {
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
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
       'Accept-Language': 'en-US,en;q=0.9'
    });
    
    const searchUrl = `https://www.amazon.com/s?k=${isbn}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    const data = await page.evaluate(() => {
      // Avoid sponsored products if possible, look for data-component-type="s-search-result"
      const results = Array.from(document.querySelectorAll('div[data-component-type="s-search-result"]'));
      let targetResult = results[0];
      
      if (!targetResult) {
        // Fallback
        targetResult = document.querySelector('.s-result-item');
      }

      if (!targetResult) return null;
      
      const priceWholeElem = targetResult.querySelector('.a-price-whole');
      const priceFractionElem = targetResult.querySelector('.a-price-fraction');
      const symbolElem = targetResult.querySelector('.a-price-symbol');
      
      let priceText = '';
      if (priceWholeElem && priceFractionElem) {
        priceText = (symbolElem ? symbolElem.innerText : '') + priceWholeElem.innerText + priceFractionElem.innerText;
      } else {
        const rawPriceElem = targetResult.querySelector('.a-price .a-offscreen');
        if (rawPriceElem) {
            priceText = rawPriceElem.innerText;
        }
      }
      
      let link = window.location.href;
      const linkElem = targetResult.querySelector('a.a-link-normal.s-no-outline');
      if (linkElem && linkElem.href) {
        link = linkElem.href;
      }
      
      return { priceText, link };
    });
    
    if (!data || !data.priceText) {
      return null;
    }
    
    const { priceText, link } = data;
    
    // Attempt to parse currency and number
    // Strip everything except digits and decimal separators
    const numMatch = priceText.match(/[\d,.]+/);
    if (!numMatch) return null;
    
    let priceNumberStr = numMatch[0];
    
    // Check symbols:
    let currency = 'USD';
    if (priceText.includes('HUF') || priceText.includes('Ft')) {
        currency = 'HUF';
        priceNumberStr = priceNumberStr.replace(/,/g, ''); // HUF formatting like 20,031
    } else if (priceText.includes('€') || priceText.includes('EUR')) {
        currency = 'EUR';
        priceNumberStr = priceNumberStr.replace(/,/g, '.'); // Convert european comma
    } else {
        // Assume USD
        priceNumberStr = priceNumberStr.replace(/,/g, ''); 
    }
    
    const price = parseFloat(priceNumberStr);
    
    if (isNaN(price) || price === 0) {
        return null;
    }

    return {
      store: 'Amazon',
      condition: 'New',
      price: price,
      currency: currency,
      buyUrl: link
    };
    
  } catch (err) {
    console.error(`Amazon scraper error for ISBN ${isbn}:`, err.message);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
