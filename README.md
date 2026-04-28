# BookHunt

Egy könyvkereső és -összehasonlító webalkalmazás: kereshetsz könyveket, nyomon követheted az árakat különböző webshopokban, értékeléseket írhatsz, elmentheted a kedvenceidet és személyes jegyzeteket vezethetsz.

**Élő verzió:** [bookhunt.pollak.info](https://bookhunt.pollak.info)

**Dizájn és funkcióterv (Figma):** [Megtekintés](https://www.figma.com/design/6Sfcfak6pxeAkFoFLjsLJA/BookHunt?m=auto&t=BsCw4jXg10MAnhda-6)

**PPT angol bemutató:** [Megtekintés](https://canva.link/bookhuntprez)

---

BookHunt PPT:
https://www.canva.com/design/DAHHaVvPhek/vf3elLAbcMK96Bpc8SB_5g/view?utm_content=DAHHaVvPhek&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h68448ca586#1

## Technológiai stack

### Backend
- Node.js + Express
- Prisma ORM (MySQL)
- JWT + bcryptjs (hitelesítés)
- Swagger (API dokumentáció)
- Puppeteer + Stealth plugin (web scraping)
- Axios + Cheerio (könnyű HTTP scraperek)

### Frontend
- React + TypeScript (Vite)
- Egyedi CSS (Sötét, Világos, Halloween és Ünnepi téma támogatással)

---

## Főbb funkciók és újdonságok

A projekt folyamatosan fejlődik, az eddig elkészült legfontosabb funkciók:

- **Felhasználói fiókok:** Regisztráció, bejelentkezés, profilképek kezelése, JWT alapú hitelesítés.
- **Adminisztrációs felület (RBAC):** Admin és User jogosultságok, felhasználó- és tartalomkezelés.
- **Reszponzív dizájn:** Teljes mobil támogatás, burger menü, letisztult felület.
- **Témák:** Dinamikusan váltható globális témák (Sötét, Világos v2, Halloween, Ünnepi).
- **Árösszehasonlítás:** 9 webshop egyidejű lekérdezése `Promise.allSettled` használatával (pl. Libri, Bookline integráció).
- **Könyvjelzők és Kívánságlista:** Kedvenc könyvek mentése, árriasztások beállítása.
- **Értesítések:** Árriasztások, háttérben futó Cron scanner, vizuális visszajelzések.
- **Biztonság és stabilitás:** Rate limiting, automatizált bot-detektálás elkerülése (stealth technika), adatszűrés.
- **Fórum és közösség:** Értékelések írása, reaktív fórum funkciók.

---

## Támogatott scraperek

Az alkalmazás az alábbi webshopokból kéri le az árakat párhuzamosan:

| Webshop | Deviza | Kategória |
|---|---|---|
| Libri.hu | HUF | Könyv |
| Bookline.hu | HUF | Könyv |
| Libristo | HUF | Könyv |
| Amazon | USD / EUR | Könyv + Manga |
| Barnes & Noble | USD | Könyv |
| ThriftBooks | USD | Könyv (használt) |
| Walts Comic Shop | EUR | Manga + Képregény |
| Crunchyroll Store| USD | Manga |
| BooksRun (API) | USD | Könyv (új + használt) |

> **Kategória-optimalizálás:** Ha egy tétel `MANGA` típusú, a rendszer **csak a manga-specifikus** scrapereket futtatja (Walts, Amazon, Crunchyroll). A többi (pl. Libri, Bookline) kihagyásra kerül, jelentősen csökkentve a válaszidőt.

---

## Telepítés és futtatás

**1. Repository klónozása**
```bash
git clone https://github.com/your-username/BookHunt.git
cd BookHunt
```

**2. Backend beállítása**
```bash
cd backend
npm install
```

Hozd létre a `.env` fájlt a backend mappában:
```env
DATABASE_URL="mysql://root:@localhost:3306/bookhunt"
JWT_SECRET="bookhunt_secret"
```

Adatbázis migráció és mintaadatok betöltése (a scraperek előzetes futtatása miatt 5-15 percet vehet igénybe):
```bash
npx prisma migrate deploy
node prisma/seed.js
```

Backend indítása:
```bash
node src/server.js
```

**3. Frontend beállítása**
```bash
cd ../frontend
npm install
npm run dev
```

---

## API Dokumentáció
A lokális szerver indítása után a Swagger API dokumentáció elérhető az alábbi címen:
`http://localhost:5000/api-docs`