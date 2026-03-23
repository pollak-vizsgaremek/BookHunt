import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

(async () => {
    const query = 'Batman'; 
    try {
        const res = await axios.get(`https://waltscomicshop.com/search?q=${query}`);
        fs.writeFileSync('walts.html', res.data);
        console.log('Saved walts.html, length:', res.data.length);
        
        const $ = cheerio.load(res.data);
        const prices = [];
        $('.price, .price-item, .money').each((i, el) => prices.push($(el).text().trim()));
        console.log('Prices with .price/.money:', prices.slice(0, 5));
        
        const gridItems = [];
        $('.grid-product__title, .product-item__title, .card__heading, .h4, a').each((i, el) => {
            const txt = $(el).text().trim();
            if (txt.includes('Batman')) gridItems.push(txt);
        });
        console.log('Titles containing Batman:', gridItems.slice(0, 5));
        
    } catch(e) {
        console.error(e.message);
    }
})();
