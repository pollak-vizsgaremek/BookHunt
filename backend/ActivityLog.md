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

---

## To-Do List
- Implement user roles and permissions
- Write unit and integration tests
- Write code comments
- Admin page -> user management, book management, review management, etc.
- Clean database structure
- Upgrade blocked scrapers (B&N, ThriftBooks) with stealth plugins or proxies

---