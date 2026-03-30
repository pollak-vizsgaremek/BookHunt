import { politeScraper, delay } from './scraper.js';
import * as cheerio from 'cheerio';

export const scrapeLibri = async (isbn) => {
  try {
    // Add a randomized polite delay (1-3 seconds)
    await delay(1000 + Math.random() * 2000);
    
    let url = `https://www.libri.hu/konyv/isbn/${isbn}.html`;
    let response;
    
    try {
      response = await politeScraper.get(url);
      // Check for soft 404
      const $check = cheerio.load(response.data);
      if (!$check('.online').text().trim() && !$check('.price-holder').text().trim() && !$check('.price').text().trim()) {
        throw new Error('Soft 404');
      }
    } catch (error) {
      if ((error.response && error.response.status === 404) || error.message === 'Soft 404') {
        // Fallback to library search
        const searchUrl = `https://www.libri.hu/talalati_lista/?text=${isbn}`;
        const searchResponse = await politeScraper.get(searchUrl);
        const $S = cheerio.load(searchResponse.data);
        
        // Find first link going to a book page
        const firstBookLink = $S('a').filter((i, el) => {
          const href = $S(el).attr('href');
          return href && href.includes('/konyv/') && !href.includes('talalati_lista');
        }).first().attr('href');
        
        if (!firstBookLink) return null;
        
        url = firstBookLink.startsWith('http') ? firstBookLink : `https://www.libri.hu${firstBookLink}`;
        response = await politeScraper.get(url);
      } else {
        throw error;
      }
    }

    const $ = cheerio.load(response.data);
    
    // Finds the element containing the price (e.g., "5 841 Ft")
    const priceText = $('.online').text().trim() || $('.price-holder').text().trim() || $('.price').text().trim() || $('.discount-price').text().trim();
    
    if (!priceText) {
      console.log(`[Libri Debug] No priceText found on URL: ${url}`);
      return null;
    }
    
    // Remove spaces and extract the number (e.g. "5 841 Ft" -> "5841")
    const priceMatch = priceText.replace(/\s+/g, '').match(/\d+/);
    if (!priceMatch) {
      console.log(`[Libri Debug] Regex failed on priceText: ${priceText}`);
      return null;
    }
    
    const price = parseInt(priceMatch[0], 10);
    
    return {
      store: 'libri.hu',
      condition: 'New',
      price: price,
      currency: 'HUF',
      buyUrl: url
    };
  } catch (error) {
    console.error(`Libri scraper error for ISBN ${isbn}:`, error.message);
    return null;
  }
};
