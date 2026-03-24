import puppeteer from 'puppeteer';

export const scrapeCrunchyroll = async (isbn) => {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const searchUrl = `https://store.crunchyroll.com/search?q=${isbn}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
    
    // Wait for the dynamic content to load
    await page.waitForSelector('.product-tile, .sales .value', { timeout: 10000 }).catch(() => {});
    
    const data = await page.evaluate(() => {
      // Find the first product tile (with fallbacks for updated classes)
      const productTile = document.querySelector('.product-tile, div[class*="product-tile"], .css-13o7eu2');
      if (!productTile) return null;
      
      const priceElement = productTile.querySelector('.sales .value, .price .value, span.chakra-text, [class*="price"]');
      const linkElement = productTile.querySelector('a.link, a.product-tile-link, a[href*="/products/"]');
      
      let priceText = priceElement ? priceElement.innerText : null;
      let link = linkElement ? linkElement.href : null;
      
      return { priceText, link };
    });
    
    if (!data || !data.priceText) return null;
    
    // Parse USD ($12.99)
    const priceMatch = data.priceText.replace(/,/g, '').match(/\d+(\.\d+)?/);
    if (!priceMatch) return null;
    
    const price = parseFloat(priceMatch[0]);
    if (isNaN(price) || price === 0) return null;

    return {
      store: 'Crunchyroll Store',
      condition: 'New',
      price: price,
      currency: 'USD',
      buyUrl: data.link || searchUrl
    };
  } catch (err) {
    console.error(`Crunchyroll scraper error for ISBN ${isbn}:`, err.message);
    return null;
  } finally {
    if (browser) await browser.close();
  }
};
