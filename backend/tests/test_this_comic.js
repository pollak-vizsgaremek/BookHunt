import { scrapeCrunchyroll } from './src/services/crunchyrollScraper.js';
import { scrapeThriftBooks } from './src/services/thriftbooksScraper.js';
import { scrapeWalts } from './src/services/waltsScraper.js';

const pkey = 'PKEY:T2273500035001';
const title = 'DC vs Vampires: World War V';

async function testQuery(name, scraperFunc, query) {
  console.log(`\nTesting ${name} with query: '${query}'`);
  try {
    const res = await scraperFunc(query); 
    console.log(`${name} Result:`, res ? JSON.stringify(res, null, 2) : 'null');
  } catch (e) {
    console.error(`${name} Error:`, e.message);
  }
}

async function run() {
  console.log('--- Testing PKEY ---');
  await testQuery('Crunchyroll', scrapeCrunchyroll, pkey);
  await testQuery('ThriftBooks', scrapeThriftBooks, pkey);
  await testQuery('Walts', scrapeWalts, pkey);

  console.log('\n--- Testing Title ---');
  await testQuery('Crunchyroll', scrapeCrunchyroll, title);
  await testQuery('ThriftBooks', scrapeThriftBooks, title);
  await testQuery('Walts', scrapeWalts, title);
}

run();
