import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
   const isbn = '9781974723119'; // Jujutsu Kaisen Vol 6

   let browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
   const page = await browser.newPage();
   await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
   
   console.log('Fetching Crunchyroll...');
   await page.goto(`https://store.crunchyroll.com/search?q=${isbn}`, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
   await new Promise(r => setTimeout(r, 3000));
   const crHtml = await page.content();
   fs.writeFileSync('cr-puppy.html', crHtml);
   
   console.log('Fetching ThriftBooks...');
   await page.goto(`https://www.thriftbooks.com/browse/?b.search=${isbn}`, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
   await new Promise(r => setTimeout(r, 3000));
   const tbHtml = await page.content();
   fs.writeFileSync('tb-puppy.html', tbHtml);

   console.log('Fetching Barnes & Noble...');
   await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
   await page.goto(`https://www.barnesandnoble.com/s/${isbn}`, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
   await new Promise(r => setTimeout(r, 4000));
   const bnHtml = await page.content();
   fs.writeFileSync('bn-puppy.html', bnHtml);

   await browser.close();
   console.log('Done.');
})();
