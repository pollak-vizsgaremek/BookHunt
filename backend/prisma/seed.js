/**
 * seed.js — BookHunt Database Seeding Script
 *
 * Futtatás: node prisma/seed.js  (a backend/ mappából)
 *
 * Mit csinál:
 *  1. Feltölti a WebAruhaz táblát az ismert webshopokkal
 *  2. Létrehozza a 15 mintaterméket (9 könyv + 6 manga) a helyes Szerzok relációval
 *  3. Létrehoz egy tesztfelhasználót
 *  4. Minden termékhez futtatja a kategória-specifikus scrapereket
 *  5. A scraper eredményeit elmenti a GyorsitotarazottAr cache táblába
 */

import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from 'bcryptjs';
import { runScrapers } from '../src/services/scraperOrchestrator.js';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Sample items: 9 books + 6 manga
// ---------------------------------------------------------------------------
const SAMPLE_ITEMS = [
  // --- BOOKS ---
  {
    cim: '1984',
    tipus: 'konyv',
    isbn_issn: '9780451524935',
    boritokep: 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg',
    szerzok: ['George Orwell'],
    isManga: false,
  },
  {
    cim: 'The Great Gatsby',
    tipus: 'konyv',
    isbn_issn: '9780743273565',
    boritokep: 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg',
    szerzok: ['F. Scott Fitzgerald'],
    isManga: false,
  },
  {
    cim: 'Dune',
    tipus: 'konyv',
    isbn_issn: '9780441013593',
    boritokep: 'https://covers.openlibrary.org/b/isbn/9780441013593-L.jpg',
    szerzok: ['Frank Herbert'],
    isManga: false,
  },
  {
    cim: "Harry Potter and the Philosopher's Stone",
    tipus: 'konyv',
    isbn_issn: '9780439708180',
    boritokep: 'https://covers.openlibrary.org/b/isbn/9780439708180-L.jpg',
    szerzok: ['J. K. Rowling'],
    isManga: false,
  },
  {
    cim: 'The Hobbit',
    tipus: 'konyv',
    isbn_issn: '9780547928227',
    boritokep: 'https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg',
    szerzok: ['J. R. R. Tolkien'],
    isManga: false,
  },
  {
    cim: 'Sapiens: A Brief History of Humankind',
    tipus: 'konyv',
    isbn_issn: '9780062316097',
    boritokep: 'https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg',
    szerzok: ['Yuval Noah Harari'],
    isManga: false,
  },
  {
    cim: 'Atomic Habits',
    tipus: 'konyv',
    isbn_issn: '9780735211292',
    boritokep: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg',
    szerzok: ['James Clear'],
    isManga: false,
  },
  {
    cim: 'The Name of the Wind',
    tipus: 'konyv',
    isbn_issn: '9780756404741',
    boritokep: 'https://covers.openlibrary.org/b/isbn/9780756404741-L.jpg',
    szerzok: ['Patrick Rothfuss'],
    isManga: false,
  },
  {
    cim: 'Project Hail Mary',
    tipus: 'konyv',
    isbn_issn: '9780593135204',
    boritokep: 'https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg',
    szerzok: ['Andy Weir'],
    isManga: false,
  },

  // --- MANGA ---
  {
    cim: 'Berserk, Vol. 1',
    tipus: 'manga',
    isbn_issn: '9781593070205',
    boritokep: 'https://covers.openlibrary.org/b/isbn/9781593070205-L.jpg',
    szerzok: ['Kentaro Miura'],
    isManga: true,
  },
  {
    cim: 'Attack on Titan, Vol. 1',
    tipus: 'manga',
    isbn_issn: '9781612620244',
    boritokep: 'https://covers.openlibrary.org/b/isbn/9781612620244-L.jpg',
    szerzok: ['Hajime Isayama'],
    isManga: true,
  },
  {
    cim: 'Demon Slayer: Kimetsu no Yaiba, Vol. 1',
    tipus: 'manga',
    isbn_issn: '9781974700523',
    boritokep: 'https://covers.openlibrary.org/b/isbn/9781974700523-L.jpg',
    szerzok: ['Koyoharu Gotouge'],
    isManga: true,
  },
  {
    cim: 'One Piece, Vol. 1',
    tipus: 'manga',
    isbn_issn: '9781569319017',
    boritokep: 'https://covers.openlibrary.org/b/isbn/9781569319017-L.jpg',
    szerzok: ['Eiichiro Oda'],
    isManga: true,
  },
  {
    cim: 'Fullmetal Alchemist, Vol. 1',
    tipus: 'manga',
    isbn_issn: '9781591169208',
    boritokep: 'https://covers.openlibrary.org/b/isbn/9781591169208-L.jpg',
    szerzok: ['Hiromu Arakawa'],
    isManga: true,
  },
  {
    cim: 'Death Note, Vol. 1',
    tipus: 'manga',
    isbn_issn: '9781421501697',
    boritokep: 'https://covers.openlibrary.org/b/isbn/9781421501697-L.jpg',
    szerzok: ['Tsugumi Ohba', 'Takeshi Obata'],
    isManga: true,
  },
];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------
async function main() {
  console.log('🌱 BookHunt seed started...\n');

  // 1. Webshops
  await prisma.webAruhaz.createMany({
    data: [
      { url: 'https://www.libri.hu',              nev: 'Libri Könyvesbolt' },
      { url: 'https://bookline.hu',               nev: 'Bookline' },
      { url: 'https://www.amazon.com',            nev: 'Amazon' },
      { url: 'https://www.libristo.hu',           nev: 'Libristo' },
      { url: 'https://www.barnesandnoble.com',    nev: 'Barnes & Noble' },
      { url: 'https://www.thriftbooks.com',       nev: 'ThriftBooks' },
      { url: 'https://store.crunchyroll.com',     nev: 'Crunchyroll Store' },
      { url: 'https://waltscomicshop.com',        nev: "Walt's Comic Shop" },
    ],
    skipDuplicates: true,
  });
  console.log('✅ WebAruhaz records seeded.');

  // 2. Products with correct Szerzok many-to-many relation (connectOrCreate)
  const termekIds = [];
  for (const item of SAMPLE_ITEMS) {
    // Check if a record with this ISBN already exists to avoid duplicates
    let saved = await prisma.termek.findFirst({
      where: { isbn_issn: item.isbn_issn },
    });

    if (!saved) {
      try {
        saved = await prisma.termek.create({
          data: {
            cim:       item.cim,
            tipus:     item.tipus,
            isbn_issn: item.isbn_issn,
            boritokep: item.boritokep,
            Szerzok: {
              connectOrCreate: item.szerzok.map((nev) => ({
                where:  { nev },
                create: { nev },
              })),
            },
          },
        });
      } catch (createErr) {
        console.warn(`  ⚠️  Could not create termek "${item.cim}": ${createErr.message}`);
        continue;
      }
    }

    termekIds.push({ ...item, termek_id: saved.termek_id });
    console.log(`  📖 Termek ready: "${item.cim}" (ID ${saved.termek_id})`);
  }
  console.log(`\n✅ ${termekIds.length} Termek records seeded.\n`);

  // 3. Test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  await prisma.felhasznalo.upsert({
    where:  { felhasznalonev: 'testuser' },
    update: {},
    create: {
      felhasznalonev: 'testuser',
      email:          'testuser@bookhunt.com',
      jelszo:         hashedPassword,
    },
  });
  console.log('✅ Test user seeded.\n');

  // 4. Run categorized scrapers and cache results
  console.log('🔍 Running scrapers for each item (this may take several minutes)...\n');

  const scraperTasks = termekIds.map(async (item) => {
    const isbn = item.isbn_issn;
    console.log(`  ⏳ Scraping "${item.cim}" (ISBN: ${isbn}, manga: ${item.isManga})...`);

    try {
      const { offers, allRows } = await runScrapers({
        isbn,
        isManga: item.isManga,
        isComic: false,
      });

      const resultData = {
        isbn,
        fetchedAt: new Date().toISOString(),
        offers,
        allRows,
      };

      await prisma.gyorsitotarazottAr.upsert({
        where:  { isbn },
        update: { adatok: resultData, frissitve: new Date() },
        create: { isbn, adatok: resultData },
      });

      console.log(`  ✅ "${item.cim}" — ${offers.length} offer(s) found, cached.`);
    } catch (err) {
      console.warn(`  ❌ Scraping failed for "${item.cim}": ${err.message}`);
    }
  });

  // Run all scraper tasks; one failure must not abort the others
  await Promise.allSettled(scraperTasks);

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
