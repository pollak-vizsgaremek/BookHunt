import puppeteer from 'puppeteer';

async function debugThriftBooks() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setExtraHTTPHeaders({
     'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
     'Accept-Language': 'en-US,en;q=0.9'
  });
  
  const searchUrl = 'https://www.thriftbooks.com/browse/?b.search=Harry%20Potter';
  console.log('Navigating to:', searchUrl);
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
  
  await new Promise(resolve => setTimeout(resolve, 3000)); // wait for dynamic loads
  
  await page.screenshot({ path: 'thriftbooks_debug.png', fullPage: true });
  console.log('Screenshot saved to thriftbooks_debug.png');
  
  await browser.close();
}

debugThriftBooks();
