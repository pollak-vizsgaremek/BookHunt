import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

export async function scrapeLibri(query) {
    try {
        const url = `https://www.libri.hu/talalati_lista/?text=${encodeURIComponent(query)}`;
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'hu-HU,hu;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://www.libri.hu/'
            }
        });

        // Libri is usually iso-8859-2 encoded
        const data = iconv.decode(response.data, 'iso-8859-2');

        const $ = cheerio.load(data);
        const books = [];

        $('.product-grid-item').each((i, el) => {
            const titleElement = $(el).find('h3.book a, h2.book a');
            let title = titleElement.text().trim();
            if (!title) {
                title = $(el).find('a').attr('title');
            }
            if (!title) return;

            const author = $(el).find('.author, .text-top p').text().trim() || "Unknown author";
            
            // Handle image extraction
            let cover = null;
            const imgEl = $(el).find('img');
            if (imgEl.attr('data-src')) {
                cover = imgEl.attr('data-src');
            } else if (imgEl.attr('src')) {
                cover = imgEl.attr('src');
            }
            if (cover && cover.startsWith('//')) cover = 'https:' + cover;

            const relativeLink = titleElement.attr('href') || $(el).find('a').attr('href');
            const link = relativeLink ? `https://www.libri.hu${relativeLink}` : null;

            // Price extraction
            let price = $(el).find('.price, .price-discount, .text-bottom strong').text().trim();
            if (!price) {
                 price = $(el).find('.price').text().trim();
            }

            // Parse price to number for comparison
            let priceNum = 999999;
            if (price) {
                const numericMatch = price.replace(/\D/g, '');
                if (numericMatch) {
                    priceNum = parseInt(numericMatch, 10);
                }
            }

            const slug = relativeLink 
                ? relativeLink.replace(/^\/konyv\//, '').replace(/\//g, '_').split('?')[0]
                : Buffer.from(title + author).toString('hex').slice(0, 12);

            books.push({
                googleId: `libri_${slug}`,
                title,
                authors: [author],
                description: "Libri result",
                thumbnail: cover,
                price: price || null,
                priceNum: priceNum,
                previewLink: link,
                source: 'libri'
            });
        });

        // Deduplicate by title (case-insensitive) and keep the cheapest one
        const uniqueBooksMap = new Map();
        for (const book of books) {
            const key = book.title.toLowerCase().trim();
            if (!uniqueBooksMap.has(key)) {
                uniqueBooksMap.set(key, book);
            } else {
                const existingBook = uniqueBooksMap.get(key);
                // If the new book is cheaper, replace the existing one
                if (book.priceNum < existingBook.priceNum) {
                    uniqueBooksMap.set(key, book);
                }
            }
        }

        // Convert back to array, remove the temporary priceNum, and return max 8 results
        const finalBooks = Array.from(uniqueBooksMap.values()).map(b => {
            delete b.priceNum;
            return b;
        }).slice(0, 8);

        return finalBooks;

    } catch (error) {
        console.error("Libri scraper error:", error.message);
        return [];
    }
}
