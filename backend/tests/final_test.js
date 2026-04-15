import { scrapeBookline } from '../src/services/booklineScraper.js';
import { scrapeLibristo } from '../src/services/libristoScraper.js';
import { scrapeAmazon } from '../src/services/amazonScraper.js';
import dotenv from 'dotenv';

dotenv.config();

const isbns = [
  { label: 'Harry Potter (HU)', value: '9789635992607' },
  { label: 'Harry Potter (EN)', value: '9780747532743' }
];

async function testFinal() {
  for (const item of isbns) {
    console.log(`\n\n================================`);
    console.log(`Testing for ${item.label}: ${item.value}`);
    console.log(`================================`);
    
    const scrapers = [
      { name: 'Bookline', fn: scrapeBookline },
      { name: 'Libristo', fn: scrapeLibristo },
      { name: 'Amazon', fn: scrapeAmazon }
    ];

    for (const scraper of scrapers) {
      try {
        console.log(`\n--- Running ${scraper.name} ---`);
        const result = await scraper.fn(item.value);
        console.log(`${scraper.name} Result:`, JSON.stringify(result, null, 2));
      } catch (error) {
        console.error(`${scraper.name} Error:`, error.message);
      }
    }
  }
}

testFinal();
