import { politeScraper, delay } from './scraper.js';
import * as cheerio from 'cheerio';

export const scrapeBookline = async (isbn) => {
  try {
    // Add a randomized polite delay (1-3 seconds)
    await delay(1000 + Math.random() * 2000);
    
    // Bookline handles ISBN routing best via search, which auto-redirects to product if exact match
    const searchUrl = `https://bookline.hu/search/search.action?searchfield=${isbn}`;
    const response = await politeScraper.get(searchUrl);
    
    const $ = cheerio.load(response.data);
    
    // Check if we hit a product page by looking for the price
    const priceText = $('.o-product-prices .price').first().text().trim() || $('.price').first().text().trim();
    
    if (!priceText) {
      return null;
    }
    
    // Extract the number ignoring spaces and formatting
    const priceMatch = priceText.replace(/\s+/g, '').match(/\d+/);
    if (!priceMatch) {
      return null;
    }
    
    const price = parseInt(priceMatch[0], 10);
    
    // The final URL after potential redirects
    const finalUrl = response.request?.res?.responseUrl || searchUrl;
    
    return {
      store: 'bookline.hu',
      condition: 'New',
      price: price,
      currency: 'HUF',
      buyUrl: finalUrl
    };
  } catch (error) {
    console.error(`Bookline scraper error for ISBN ${isbn}:`, error.message);
    return null;
  }
};
