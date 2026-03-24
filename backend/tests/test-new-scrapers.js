import puppeteer from 'puppeteer';

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const isbn = '9781401271162'; // Batman: The Killing Joke, typically available everywhere
    
    console.log('--- Testing Walts Comic Shop ---');
    const waltsUrl = `https://waltscomicshop.com/search?q=${isbn}`;
    await page.goto(waltsUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    const waltsData = await page.evaluate(() => {
      // Find a price
      const priceElem = document.querySelector('.price, .price-item, .product-price');
      // Find a link
      const linkElem = document.querySelector('a.grid-view-item__link, a.product-card__link, a.product-item__title');
      return {
        price: priceElem ? priceElem.innerText : null,
        link: linkElem ? linkElem.href : null,
        html: document.body.innerHTML.substring(0, 500) // just to see something if failed
      };
    });
    console.log('Walts Data:', waltsData.price, waltsData.link);

    console.log('\n--- Testing Amazon ---');
    const amazonUrl = `https://www.amazon.com/s?k=${isbn}`;
    await page.goto(amazonUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    const amazonData = await page.evaluate(() => {
      const priceWhole = document.querySelector('.a-price-whole');
      const priceFraction = document.querySelector('.a-price-fraction');
      const symbol = document.querySelector('.a-price-symbol');
      
      let price = null;
      if (priceWhole && priceFraction) {
        price = (symbol ? symbol.innerText : '') + priceWhole.innerText + priceFraction.innerText;
      }
      
      const linkElem = document.querySelector('.s-result-item a.a-link-normal.s-no-outline');
      return {
        price: price,
        link: linkElem ? linkElem.href : null
      }
    });
    console.log('Amazon Data:', amazonData.price, amazonData.link);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (browser) await browser.close();
  }
})();
