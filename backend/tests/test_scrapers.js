import { scrapeBookline } from '../src/services/booklineScraper.js';
import { scrapeLibristo } from '../src/services/libristoScraper.js';
import { scrapeWalts } from '../src/services/waltsScraper.js';
import { scrapeAmazon } from '../src/services/amazonScraper.js';
import { scrapeCrunchyroll } from '../src/services/crunchyrollScraper.js';
import { scrapeThriftBooks } from '../src/services/thriftbooksScraper.js';
import { scrapeBarnesAndNoble } from '../src/services/barnesAndNobleScraper.js';
import dotenv from 'dotenv';

dotenv.config();

// const isbn = '9788074849589'; // The Gambler
const isbn = '9789635992607'; // Harry Potter (Confirmed on Bookline)

async function testScrapers() {
  console.log(`Testing scrapers for ISBN: ${isbn}`);
  
  const scrapers = [
    { name: 'Bookline', fn: scrapeBookline },
    { name: 'Libristo', fn: scrapeLibristo },
    { name: 'Walts', fn: scrapeWalts },
    { name: 'Amazon', fn: scrapeAmazon },
    { name: 'Crunchyroll', fn: scrapeCrunchyroll },
    { name: 'ThriftBooks', fn: scrapeThriftBooks },
    { name: 'Barnes & Noble', fn: scrapeBarnesAndNoble }
  ];

  for (const scraper of scrapers) {
    try {
      console.log(`\n--- Running ${scraper.name} scraper ---`);
      const startTime = Date.now();
      const result = await scraper.fn(isbn);
      const duration = Date.now() - startTime;
      console.log(`${scraper.name} Result:`, JSON.stringify(result, null, 2));
      console.log(`Duration: ${duration}ms`);
    } catch (error) {
      console.error(`${scraper.name} Error:`, error.message);
    }
  }
}

testScrapers();
