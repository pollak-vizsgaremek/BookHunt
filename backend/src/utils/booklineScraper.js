import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeBookline(query) {
    try {
        const url = `https://bookline.hu/search/search.action?searchfield=${encodeURIComponent(query)}`;
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'hu-HU,hu;q=0.9,en;q=0.7',
                'Referer': 'https://bookline.hu/',
            }
        });

        const $ = cheerio.load(response.data);
        const books = [];

        $('#resultSection li').each((i, el) => {
            const titleEl = $(el).find('.o-product__title, .c-product-title a');
            const title = titleEl.first().text().trim();
            if (!title) return;

            const author = $(el).find('.o-product__author').map((_, a) => $(a).text().trim()).get().join(', ') || 'Unknown author';

            const relLink = titleEl.first().attr('href') || $(el).find('.o-product-figure__anchor').attr('href');
            const link = relLink ? `https://bookline.hu${relLink.split('&ca=')[0]}` : null;

            // Cover image (lazy-loaded via data-interchange)
            let cover = null;
            const interchange = $(el).find('img').attr('data-interchange');
            if (interchange) {
                const m = interchange.match(/\[([^,\]]+),\s*small\]/);
                if (m) cover = m[1];
            }
            if (!cover) {
                const src = $(el).find('img').attr('src');
                if (src && !src.startsWith('data:')) cover = src;
            }

            // Price: the online price is in .o-prices-block__price1 .price
            let priceText = '';
            const priceSpan = $(el).find('.o-prices-block__price1 .price');
            if (priceSpan.length) {
                priceText = priceSpan.text().trim();
            }
            if (!priceText) {
                // fallback: any span.price
                priceText = $(el).find('span.price').first().text().trim();
            }

            const priceNum = priceText ? parseInt(priceText.replace(/\D/g, ''), 10) || 999999 : 999999;

            books.push({ title, author, cover, link, priceText, priceNum });
        });

        // Deduplicate by title, keep cheapest
        const map = new Map();
        for (const b of books) {
            const key = b.title.toLowerCase().trim();
            if (!map.has(key) || b.priceNum < map.get(key).priceNum) {
                map.set(key, b);
            }
        }

        return Array.from(map.values())
            .map(({ priceNum, ...rest }) => rest) // remove internal priceNum
            .slice(0, 6);

    } catch (error) {
        console.error('Bookline scraper error:', error.message);
        return [];
    }
}
