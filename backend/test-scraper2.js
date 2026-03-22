import { scrapeLibri } from './src/services/libriScraper.js';
import { scrapeBookline } from './src/services/booklineScraper.js';
import { scrapeLibristo } from './src/services/libristoScraper.js';

async function test() {
  const isbn = '9789634065222'; // Known valid ISBN
  console.log(`Testing scrapers for ISBN: ${isbn}`);
  
  console.log('Fetching Libri...');
  const libriResult = await scrapeLibri(isbn);
  console.log('Libri Result:', libriResult ? `${libriResult.price} HUF` : 'Not found');
  
  console.log('Fetching Bookline...');
  const booklineResult = await scrapeBookline(isbn);
  console.log('Bookline Result:', booklineResult ? `${booklineResult.price} HUF` : 'Not found');

  console.log('Fetching Libristo...');
  const libristoResult = await scrapeLibristo(isbn);
  console.log('Libristo Result:', libristoResult ? `${libristoResult.price} HUF` : 'Not found');
}

test();
