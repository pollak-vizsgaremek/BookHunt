import axios from 'axios';
import * as cheerio from 'cheerio';

export const scrapeWalts = async (isbn, signal) => {
  try {
    // Navigate to Walts Comic Shop search page
    const searchUrl = `https://waltscomicshop.com/search?q=${isbn}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 10000,
      signal
    });
    
    const $ = cheerio.load(response.data);
    
    // Check if there are any products
    const firstProduct = $('.grid-product, .card-wrapper, .product-item').first();
    if (!firstProduct.length) {
      return null;
    }
    
    // Look for price
    let priceText = firstProduct.find('.price, .money, .product-item__price').text().trim();
    if (!priceText) {
      priceText = firstProduct.text(); // Fallback to entire card text and parse out EUR
    }
    
    let link = searchUrl;
    const aTag = firstProduct.find('a').first();
    if (aTag.length && aTag.attr('href')) {
      const href = aTag.attr('href');
      link = href.startsWith('http') ? href : `https://waltscomicshop.com${href}`;
    }

    // Extract Euro amount
    const priceMatch = priceText.match(/€\s*(\d+[,.]\d+)/) || priceText.match(/(\d+[,.]\d+)\s*€/);
    if (!priceMatch) {
      return null;
    }
    
    // Convert European decimal (comma) to dot
    const priceNumberStr = priceMatch[1].replace(',', '.');
    const price = parseFloat(priceNumberStr);
    
    if (isNaN(price) || price === 0) {
        return null;
    }

    return {
      store: 'Walts Comic Shop',
      condition: 'New',
      price: price,
      currency: 'EUR',
      buyUrl: link
    };
    
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return null;
    }
    throw new Error(`Walts Comic Shop scraper error for ISBN ${isbn}: ${err.message}`);
  }
};
