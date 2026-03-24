import puppeteer from 'puppeteer';

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // A popular manga ISBN (e.g. Chainsaw Man Vol 1)
        const isbn = '9781974709939'; 
        
        console.log('--- Testing Crunchyroll Store ---');
        await page.goto(`https://store.crunchyroll.com/search?q=${isbn}`, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e=>console.log('Timeout?'));
        await new Promise(r => setTimeout(r, 2000));
        const crData = await page.evaluate(() => {
            const price = document.querySelector('.price, .value, .sales .value');
            const link = document.querySelector('a.link, a.product-tile-link');
            return {
                price: price ? price.innerText.trim() : null,
                link: link ? link.href : null
            };
        });
        console.log('Crunchyroll:', crData);

        console.log('--- Testing ThriftBooks ---');
        await page.goto(`https://www.thriftbooks.com/browse/?b.search=${isbn}`, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e=>console.log('Timeout?'));
        await new Promise(r => setTimeout(r, 2000));
        const tbData = await page.evaluate(() => {
            const price = document.querySelector('.SearchResultGridItemPrice-price, .price, .book-price');
            const link = document.querySelector('.SearchResultGridItem-title a, a.SearchResultGridItem-link');
            return {
                price: price ? price.innerText.trim() : null,
                link: link ? link.href : null
            };
        });
        console.log('ThriftBooks:', tbData);

        console.log('--- Testing Barnes & Noble ---');
        await page.goto(`https://www.barnesandnoble.com/s/${isbn}`, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e=>console.log('Timeout?'));
        await page.waitForTimeout(2000);
        const bnData = await page.evaluate(() => {
            const price = document.querySelector('.current-price, .price');
            const link = document.querySelector('a.product-image-link, .product-info-title a');
            return {
                price: price ? price.innerText.trim() : null,
                link: link ? link.href : null
            };
        });
        console.log('Barnes & Noble:', bnData);

    } catch (err) {
        console.error(err);
    } finally {
        if(browser) await browser.close();
    }
})();
