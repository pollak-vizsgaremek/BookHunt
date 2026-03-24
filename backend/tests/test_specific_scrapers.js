import { scrapeBarnesAndNoble } from './src/services/barnesAndNobleScraper.js';
import { scrapeCrunchyroll } from './src/services/crunchyrollScraper.js';
import { scrapeThriftBooks } from './src/services/thriftbooksScraper.js';
import { scrapeWalts } from './src/services/waltsScraper.js';

const isbn = '9781421544328'; // Naruto Volume 1

async function runTests() {
  console.log('--- Testing Scrapers ---');
  
  console.log('\n1. Barnes & Noble:');
  try {
    const bn = await scrapeBarnesAndNoble(isbn);
    console.log('Result:', bn);
  } catch (e) { console.error('Error:', e.message); }

  console.log('\n2. Crunchyroll:');
  try {
    const cr = await scrapeCrunchyroll(isbn);
    console.log('Result:', cr);
  } catch (e) { console.error('Error:', e.message); }

  console.log('\n3. ThriftBooks:');
  try {
    const tb = await scrapeThriftBooks(isbn);
    console.log('Result:', tb);
  } catch (e) { console.error('Error:', e.message); }

  console.log('\n4. Walts Comic Shop:');
  try {
    const wt = await scrapeWalts(isbn);
    console.log('Result:', wt);
  } catch (e) { console.error('Error:', e.message); }

  console.log('\n--- Finished Testing ---');
}

runTests();
