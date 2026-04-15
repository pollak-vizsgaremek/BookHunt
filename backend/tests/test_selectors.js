import { scrapeCrunchyroll } from './src/services/crunchyrollScraper.js';
import { scrapeThriftBooks } from './src/services/thriftbooksScraper.js';
import { scrapeWalts } from './src/services/waltsScraper.js';

async function testKeyword(name, scraperFunc, keyword) {
  console.log(`\nTesting ${name} with keyword: '${keyword}'`);
  try {
    // Monkey patch the function momentarily or just call it if it takes a string
    const res = await scraperFunc(keyword); 
    console.log(`${name} Result:`, res);
  } catch (e) {
    console.error(`${name} Error:`, e.message);
  }
}

async function run() {
  // Test with terms likely to produce results
  await testKeyword('Crunchyroll', scrapeCrunchyroll, 'Naruto');
  await testKeyword('ThriftBooks', scrapeThriftBooks, 'Harry Potter');
  await testKeyword('Walts', scrapeWalts, 'Batman');
}

run();
