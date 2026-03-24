import puppeteer from 'puppeteer';

async function debugThriftBooks() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  const searchUrl = 'https://www.thriftbooks.com/browse/?b.search=Harry%20Potter';
  console.log('Navigating to:', searchUrl);
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
  
  await page.waitForSelector('.SearchResultGridItem, .book-price, .AllEditionsItem-price', { timeout: 10000 }).catch(() => {});
  
  const debugData = await page.evaluate(() => {
    const item = document.querySelector('.SearchResultGridItem, .AllEditionsItem, .product-item, .AllEditionsItem-tile, .SearchResultListItem');
    if (!item) return { foundItem: false };
    
    // Log available classes on the item
    const classes = item.className;
    
    // Find absolute all children containing 'price' or '$'
    const priceNodes = Array.from(item.querySelectorAll('*')).filter(n => n.innerText && n.innerText.includes('$')).map(n => ({ tag: n.tagName, class: n.className, text: n.innerText.trim() }));
    
    return {
       foundItem: true,
       classes: classes,
       priceNodes: priceNodes
    };
  });
  
  console.log('Debug Data:', JSON.stringify(debugData, null, 2));
  await browser.close();
}

debugThriftBooks();
