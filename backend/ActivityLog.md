# Activity Log - Kitti

## 2026
- GitHub repo, dev branch, base setup

## 2026.01.28
- Set up Prisma with MySQL (checked the docs)
- Installed and set up Express
- Added `cors` and `dotenv`
- Installed `nodemon` and added the `"dev": "nodemon server.js"` script setup
- Installed `jsonwebtoken` and `bcryptjs` for auth stuff

## 2026.02.02
- Worked on `prisma/schema.prisma` -> set up the database and migrations
- Added models and relations
- Started on web scraping... installed `axios`, `cheerio`, and `puppeteer` -> putting this in `src/services`
- Dealt with Prisma V6 breaking things: had to downgrade, generate the client (added to `.gitignore`), test migrations, and change the API port 

## 2026.02.17
- Worked on `server.js` 
- Set up some API routes

## 2026.02.23
- Fixed `seed.ts` so it works now
- Looked into Book APIs for data
- Fixed login logic (username OR email)
- Fixed Express routing bug where `/api/webshops` and other API endpoints were being intercepted by a catch-all `app.use('/')` route
- Initialized `PrismaClient` in `server.js` to fix reference errors
- Fixed a Prisma schema typo (`wearuhaz_id` -> `webaruhaz_id`) that was causing fetch failures on the `/api/webshops` endpoint
- Refactored `server.js`
- Connected user data routes (Favorites, Searches, Notes)
- Added CRUD endpoints for price tracking
- Set up GET by ID routes for literally everything

## 2026.02.24
- Health.js still won't work
- npm install express swagger-ui-express swagger-jsdoc

## 2026.02.26
- Health check into `server.js`
- Removed `authenticate` from `productsRoutes`
- Swagger setup
- Added reviews to the database
- Added reviews routes

## 2026.03.21
- Added Google Books API integration
- Added BooksRun API integration (routes)
- Added currency conversion (USD to HUF in utils)

## 2026.03.22
- Added Google OAuth setup
- Fixed the filter modal

## 2026.03.23
- Set up Open Library API integration
- Implemented soft web scraping for Walts Comic Shop and Amazon
- Fixed currency switch
- Implemented scrapers for Crunchyroll, ThriftBooks, and Barnes & Noble

## 2026.03.24
- Fixed slow scraper loads: reduced Puppeteer timeouts to 12s and added 15s absolute safety bounds in `compare.js`
- Updated scraper selectors for Crunchyroll and Walts Comic Shop to match new site layouts
- Identified that Barnes & Noble and ThriftBooks are blocking headless scrapers directly
- Added a manual **Refresh button** in the frontend details modal and cache-bypass param on the backend API
- Created test folder and test files
- Implemented continuous Price Alert system: extended Wishlist with ISBN thresholds, created a background Cron scraper scanner, and introduced Frontend notification badges with a timeline alerts dashboard view

## 2026.03.25
- Only search for manga on Crunchyroll
- Only search for comics on Walts
- Default search order: popularity (descending) 
- **Database Refactor**:
  - Translated entire `prisma.schema` to Hungarian (models & fields)
  - Implemented many-to-many relationship for Authors (`Szerzo` table)
  - Cleaned up database structure and removed unused fields
  - Updated all backend routes and services to match the new schema

## 2026.03.30
- **Security & Stability**: Global error handler (`errorHandler.js`), auth bug fixes (`undefined` fields, JWT errors), `403→401` for invalid tokens, strict POST/PUT validation (max 2000 chars on reviews)
- **Backend Optimization**: Centralized `scraperOrchestrator.js` with `Promise.allSettled`; refactored `priceAlertCron.js`; removed blocking `fs.writeFileSync` debug dumps
- **RBAC**: `Szerepkor` enum (`USER`/`ADMIN`) in Prisma + JWT; `requireAdmin` middleware; double-guarded `adminRoutes.js`
- **Scraper Stealth**: B&N + ThriftBooks rewritten with `puppeteer-extra-plugin-stealth`, randomized UA pools
- **Testing**: Native Node ESM Jest + Supertest; auth integration tests + currency unit tests
- **Architecture**: Analysis on `Tipus` enum → recommended N:M Categories table migration

## 2026.04.13
- **Pipeline**: `timeout.js` refactored to `AbortController` (prevents memory leaks / zombie Chromium); scrapers throw proper `Error` objects; orchestrator timeout raised to 25s
- **Stealth**: Centralized `browserUtils.js` for Puppeteer boilerplate; stealth plugin rolled out to `Amazon`, `Libristo`, `Crunchyroll`; randomized jitter + `window.scrollBy` human emulation; `TargetCloseError` swallowed on abort

## 2026.04.15
- **Scraper Overhaul**: Updated selectors + error handling across all scrapers; 3–5 CSS selector fallback chains; typed statuses (`scraperStatus: 'Error'` on 5xx/bot-block, `null` + `'Not Found'` when unlisted); soft-404 via body text ("nincs találat", "no results found")
- **Orchestrator**: Returns `offers` + `allRows`; `extractOffer()` normalises results to `'Found'`/`'Not Found'`/`'Error'`; **MANGA gate** — only `Walts`, `Amazon`, `Crunchyroll` run for MANGA items
- **Prices Table UX**: Status-aware price column (green / grey "Scraper operational" / amber "Webshop Server Error"); sort: Found↑ → Not Found → Error; buy button hidden for non-Found; spinner replaced with skeleton table
- **Seeding**: `prisma/seed.js` rewritten — 15 real-ISBN items (9 books + 6 manga), `connectOrCreate` for `Szerzok`, runs scrapers + caches to `GyorsitotarazottAr`; fixed `szerzo` direct-field bug
- **Notification Polling**: 2s startup grace period before first poll; `AbortController` cleanup on unmount; backs off to 5-min interval after 3 failures
- **Hotfixes**:
  - `priceAlertCron.js`: `orderBy` → `id`; destructure `{ offers }`; `Array.isArray` guard
  - `compare.js`: `sanitizeRows()` strips non-primitive fields before Prisma JSON save; catch logs `error.message` only (no circular refs)
  - `browserUtils.js` stealth: 5-UA pool (Chrome 122–124 + Firefox 125), matched `sec-ch-ua` headers, randomised viewport, `navigator.webdriver = false`
  - **Libri 403**: switched to stealth Puppeteer (was plain Axios); fallback logic preserved
  - **B&N 403**: Google `Referer` header; tries `/w/?ean={isbn}` first; 3s back-off retry

## 2026.04.16
- **Libri Scraper Fix**: Fixed a bug where missing books automatically inherited a false 4190 Ft catalog price from Libri's main menu, correcting the cached frontend rendering.
- The Skeleton Loader now updates in real time, so the user won't think the scraper is slow