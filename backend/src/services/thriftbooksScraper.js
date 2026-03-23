import puppeteer from 'puppeteer';

export const scrapeThriftBooks = async (isbn) => {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const searchUrl = `https://www.thriftbooks.com/browse/?b.search=${isbn}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for the dynamic content to load
    await page.waitForSelector('.SearchResultGridItem, .book-price, .AllEditionsItem-price', { timeout: 10000 }).catch(() => {});
    
    const data = await page.evaluate(() => {
      // Find the first product tile
      const item = document.querySelector('.SearchResultGridItem, .AllEditionsItem, .product-item');
      if (!item) return null;
      
      const priceElem = item.querySelector('.SearchResultGridItemPrice-price, .AllEditionsItem-price, .price, .book-price');
      const linkElem = item.querySelector('a.SearchResultGridItem-link, .SearchResultGridItem-title a, a');
      
      let priceText = priceElem ? priceElem.innerText : null;
      let link = linkElem ? linkElem.href : null;
      
      return { priceText, link };
    });
    
    if (!data || !data.priceText) return null;
    
    // Parse USD ($12.99)
    const priceMatch = data.priceText.replace(/,/g, '').match(/\d+(\.\d+)?/);
    if (!priceMatch) return null;
    
    const price = parseFloat(priceMatch[0]);
    if (isNaN(price) || price === 0) return null;

    return {
      store: 'ThriftBooks',
      condition: 'Used',
      price: price,
      currency: 'USD',
      buyUrl: data.link || searchUrl
    };
  } catch (err) {
    console.error(`ThriftBooks scraper error for ISBN ${isbn}:`, err.message);
    return null;
  } finally {
    if (browser) await browser.close();
  }
};
