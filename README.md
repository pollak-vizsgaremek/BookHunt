# BookHunt

Egy könyvárkereső és összehasonlító webalkalmazás: kereshetsz könyveket, nyomon követheted az árakat különböző webshopokban, értékeléseket írhatsz, elmentheted a kedvenceidet és személyes jegyzeteket vezethetsz.

A dizájn és a funkciós terv Figmán érhető el:
https://www.figma.com/design/6Sfcfak6pxeAkFoFLjsLJA/BookHunt?m=auto&t=BsCw4jXg10MAnhda-6

BookHunt PPT:
https://www.canva.com/design/DAHHaVvPhek/vf3elLAbcMK96Bpc8SB_5g/view?utm_content=DAHHaVvPhek&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h68448ca586#1

## Technológiai stack

**Backend**
- Node.js + Express
- Prisma ORM (MySQL)
- JWT + bcryptjs hitelesítéshez
- Swagger (swagger-jsdoc + swagger-ui-express) az API dokumentációhoz
- Puppeteer + puppeteer-extra-plugin-stealth az ár scraperekhez
- Axios + Cheerio a könnyű HTTP scraperekhez

**Frontend**
- React + TypeScript (Vite)
- Egyedi CSS, sötét/világos téma támogatással

## Támogatott scraperek

Az alkalmazás az alábbi webshopokból kéri le az árakat párhuzamosan:

| Webshop | Ár deviza | Kategória |
|---|---|---|
| libri.hu | HUF | Könyv |
| bookline.hu | HUF | Könyv |
| Libristo | HUF | Könyv |
| Amazon | USD / EUR | Könyv + Manga |
| Barnes & Noble | USD | Könyv |
| ThriftBooks | USD | Könyv (használt) |
| Walts Comic Shop | EUR | Manga + Képregény |
| Crunchyroll Store | USD | Manga |
| BooksRun (API) | USD | Könyv (új + használt) |

### Kategória-optimalizálás

Ha egy tétel `MANGA` típusú, a rendszer **csak a Walts, Amazon és Crunchyroll** scrapereket futtatja. A könyv-specifikus scraperek (Libri, Bookline, Libristo, ThriftBooks, Barnes & Noble) kihagyásra kerülnek, így jelentősen csökken az árkérés válaszideje.

## Telepítés és futtatás

```bash
git clone https://github.com/your-username/BookHunt.git
cd BookHunt

cd backend
npm i

# Hozd létre a .env fájlt a backend mappában:
#    DATABASE_URL="mysql://root:@localhost:3306/bookhunt"
#    JWT_SECRET="bookhunt_secret"

npx prisma migrate deploy

# Töltsd fel az adatbázist 15 minta könyvvel és mangával,
# és futtasd le a scrapereket az árak előzetes gyorsítótárazásához.
# (Ez 5–15 percet vehet igénybe, mivel valódi böngészőket indít el.)
node prisma/seed.js

node src/server.js
```

```bash
cd frontend
npm i
npm run dev
```

API dokumentáció: `http://localhost:5000/api-docs`

## Jelenlegi állapot — kb. 50%

### Kész
- GitHub repo felállítása `dev` branch munkafolyamattal
- Prisma séma megtervezve az összes modellel és kapcsolattal (Magyar mezőnevekkel)
- Teljes MySQL adatbázis migrációkkal és seed adatokkal
- Express backend működő REST API útvonalakkal:
  - `POST /api/auth/register` + `POST /api/auth/login` (JWT autentikáció)
  - Teljes CRUD: Products, Webshops, Prices, Favorites, Notes, Searches, Reviews
  - GET by ID minden erőforráshoz
- Swagger dokumentáció minden végponthoz
- **Árösszehasonlítás**: 9 webshopból párhuzamos scraping `Promise.allSettled`-del
  - Stealth Puppeteer böngésző bot-detektálás ellen (Amazon, B&N, ThriftBooks, Libristo, Crunchyroll, **Libri**)
  - Forgó User-Agent pool (5 Chrome/Firefox variáns), `sec-ch-ua` fejlécek, véletlenszerű viewport, `navigator.webdriver=false` override
  - Kategória-optimalizálás: manga elemek esetén csak manga-specifikus scraperek futnak
  - Árak státuszkijelzése a táblában: `Found` / `Not Found` / `Webshop Server Error`
  - Skeleton loader az árkérés közben
  - Valós idejű kiíratás
- **Ár riasztások**: Kívánságlistához rendelt küszöbértékek, háttér Cron scanner, értesítési badge a navigációban
  - Cron fix: `orderBy` mező (`kivansaglista_id` → `id`) és helyes `{ offers }` destructuring javítva
- **Stabilitás**: `sanitizeRows()` segédfüggvény a `compare.js`-ben megelőzi a `RangeError: Maximum call stack size exceeded` hibát, ha Puppeteer körkörös referenciákat tartalmazó hiba-objektumok kerülnek JSON-ba
- RBAC: `USER` / `ADMIN` szerepkörök, `requireAdmin` middleware, Admin API (felhasználó- és tartalomkezelés)
  - Frontend React + TypeScript-tel:
  - Főoldal animált carousellel és keresővel
  - Bejelentkezés és regisztrációs oldalak
  - Felhasználói profil oldal modállal
  - Sötét/világos téma váltó
  - Védett útvonalak
  - Kívánságlista és értesítési nézet
