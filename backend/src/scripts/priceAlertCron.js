import { scrapeAmazon } from '../services/amazonScraper.js';
import { scrapeCrunchyroll } from '../services/crunchyrollScraper.js';
import { scrapeThriftBooks } from '../services/thriftbooksScraper.js';
import { scrapeWalts } from '../services/waltsScraper.js';
import { scrapeLibristo } from '../services/libristoScraper.js';
import { withTimeout } from '../utils/timeout.js';

export async function checkPriceAlerts(prisma) {
  console.log("Running Price Alerts Scan...");
  try {
    const wishlists = await prisma.kivansaglista.findMany({
      where: { isbn: { not: null } },
      distinct: ['isbn'],
    });

    for (const item of wishlists) {
      const { isbn, utolso_ismert_ar, cim } = item;
      if (!utolso_ismert_ar) continue; 

      const results = await Promise.allSettled([
         withTimeout(scrapeAmazon(isbn), 15000).catch(() => null),
         withTimeout(scrapeCrunchyroll(isbn), 15000).catch(() => null),
         withTimeout(scrapeThriftBooks(isbn), 15000).catch(() => null),
         withTimeout(scrapeWalts(isbn), 15000).catch(() => null),
         withTimeout(scrapeLibristo(isbn), 15000).catch(() => null)
      ]);

      const offers = results
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => r.value);

      if (offers.length === 0) continue;

      // Find lowest price
      const lowestOffer = offers.sort((a, b) => a.price - b.price)[0];
      const threshold = parseFloat(utolso_ismert_ar);

      if (lowestOffer.price < threshold) {
         // Notify all users who have this book on wishlist
         const usersToNotify = await prisma.kivansaglista.findMany({
            where: { isbn },
            select: { felhasznalo_id: true }
         });

         for (const user of usersToNotify) {
            await prisma.ertesites.create({
               data: {
                  felhasznalo_id: user.felhasznalo_id,
                  szoveg: `Price Drop Alert! '${cim}' is now ${lowestOffer.price} ${lowestOffer.currency} on ${lowestOffer.store}!`
               }
            });
         }

         // Update threshold
         await prisma.kivansaglista.updateMany({
            where: { isbn },
            data: { utolso_ismert_ar: lowestOffer.price }
         });
      }
    }
  } catch (e) { console.error("Cron Error:", e); }
}

export function startPriceAlerts(prisma) {
   checkPriceAlerts(prisma); 
   setInterval(() => checkPriceAlerts(prisma), 12 * 60 * 60 * 1000); 
   console.log("Price Alerts Crontab initialized.");
}
