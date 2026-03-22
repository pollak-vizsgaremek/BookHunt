import axios from 'axios';

// Shared axios instance with polite headers for scraping
export const politeScraper = axios.create({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'hu-HU,hu;q=0.9,en-US;q=0.8,en;q=0.7',
  }
});

// Helper for polite delay between requests (1 to 3 seconds)
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
