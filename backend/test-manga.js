import { scrapeCrunchyroll } from './src/services/crunchyrollScraper.js';
import { scrapeThriftBooks } from './src/services/thriftbooksScraper.js';
import { scrapeBarnesAndNoble } from './src/services/barnesAndNobleScraper.js';
import { PrismaClient } from './generated/prisma/index.js';

(async () => {
   const isbn = '9781974723119';
   
   console.log('Clearing cache...');
   const prisma = new PrismaClient();
   await prisma.cachedPrice.deleteMany();
   console.log('Cache cleared.');
   
   console.log('Testing Crunchyroll...');
   console.log(await scrapeCrunchyroll(isbn));
   
   console.log('Testing ThriftBooks...');
   console.log(await scrapeThriftBooks(isbn));
   
   console.log('Testing Barnes & Noble...');
   console.log(await scrapeBarnesAndNoble(isbn));
   
   process.exit(0);
})();
