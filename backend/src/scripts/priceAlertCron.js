/**
 * priceAlertCron.js
 *
 * Háttérfolyamat, ami 12 óránként ellenőrzi az árcsökkentéseket
 * az összes beállított kívánságlistán.
 *
 * FONTOS optimalizáció: Batched (kötegelt) feldolgozás – nem tölti be
 * egyszerre az összes könyvet memóriába. BATCH_SIZE könyvenként dolgoz,
 * és csak ISBN-enkénti lekérdezést indít az orchestrátorhoz.
 */

import { runScrapers } from '../services/scraperOrchestrator.js';

const BATCH_SIZE = 20; // Egyszerre max ennyi egyedi ISBN-t dolgoz fel

export async function checkPriceAlerts(prisma) {
  console.log(`[PriceAlert] Scanning started at ${new Date().toISOString()}`);

  try {
    let skip = 0;
    let processedTotal = 0;
    let alertsSentTotal = 0;

    // Lapozva (paginated) dolgozzuk fel a wishlist elemeket
    while (true) {
      // Lekérjük a következő köteg egyedi ISBN-t
      const batch = await prisma.kivansaglista.findMany({
        where: { isbn: { not: null } },
        distinct: ['isbn'],
        select: { isbn: true, cim: true, utolso_ismert_ar: true },
        skip,
        take: BATCH_SIZE,
        orderBy: { id: 'asc' },
      });

      if (batch.length === 0) break; // Nincs több feldolgozni való

      console.log(`[PriceAlert] Processing batch: ${skip + 1}–${skip + batch.length}`);

      // Batch elemeit sorban (nem párhuzamosan!) dolgozzuk fel
      // hogy ne indítsunk egyidejűleg 20 × 5 Puppeteer-t
      for (const item of batch) {
        const { isbn, cim, utolso_ismert_ar } = item;

        // Ha nincs referencia-ár, nem tudunk áresést detektálni
        if (!utolso_ismert_ar) continue;

        try {
          const { offers } = await runScrapers({ isbn });

          if (!Array.isArray(offers) || offers.length === 0) continue;

          // Legolcsóbb ajánlat (az orchestrátor már rendezi, de biztosra megyünk)
          const lowestOffer = offers.reduce(
            (min, o) => (o.price < min.price ? o : min),
            offers[0]
          );

          const threshold = parseFloat(utolso_ismert_ar);

          if (lowestOffer.price < threshold) {
            // Értesítés küldése minden érintett felhasználónak
            const usersToNotify = await prisma.kivansaglista.findMany({
              where: { isbn },
              select: { felhasznalo_id: true },
            });

            const notifications = usersToNotify.map(user =>
              prisma.ertesites.create({
                data: {
                  felhasznalo_id: user.felhasznalo_id,
                  szoveg: `Áresés! '${cim}' mostantól ${lowestOffer.price.toLocaleString('hu-HU')} Ft ${lowestOffer.store}-ban!`,
                },
              })
            );

            // Értesítések párhuzamos létrehozása (DB műveletek, nem scrapers)
            await Promise.allSettled(notifications);

            // Referencia-ár frissítése az új legalacsonyabb árra
            await prisma.kivansaglista.updateMany({
              where: { isbn },
              data: { utolso_ismert_ar: lowestOffer.price },
            });

            alertsSentTotal += usersToNotify.length;
            console.log(`[PriceAlert] Price drop detected for "${cim}" (${isbn}): ${threshold} → ${lowestOffer.price} HUF. Notified ${usersToNotify.length} user(s).`);
          }
        } catch (itemError) {
          // Egy könyv hibája nem állítja le a többi feldolgozását
          console.error(`[PriceAlert] Error processing ISBN ${isbn}:`, itemError.message);
        }

        processedTotal++;
      }

      skip += batch.length;

      // Ha a batch kisebb volt mint BATCH_SIZE, elértük a végét
      if (batch.length < BATCH_SIZE) break;
    }

    console.log(`[PriceAlert] Scan complete. Processed: ${processedTotal} unique ISBNs, Alerts sent: ${alertsSentTotal}`);
  } catch (e) {
    console.error('[PriceAlert] Fatal cron error:', e);
  }
}

export function startPriceAlerts(prisma) {
  // Nem indítja el azonnal (a szerver indulásakor ne terhelje azonnal a scrapereket)
  // Első futás 5 perccel a szerver indítása után
  setTimeout(() => checkPriceAlerts(prisma), 5 * 60 * 1000);

  // Ismétlés: 12 óránként
  setInterval(() => checkPriceAlerts(prisma), 12 * 60 * 60 * 1000);

  console.log('[PriceAlert] Price alert cron initialized (first run in 5 minutes, then every 12 hours).');
}
