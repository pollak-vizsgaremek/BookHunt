# BookHunt

Egy könyvárkereső és összehasonlító webalkalmazás: kereshetsz könyveket, nyomon követheted az árakat különböző webshopokban, értékeléseket írhatsz, elmentheted a kedvenceidet és személyes jegyzeteket vezethetsz.

A dizájn és a funkciós terv Figmán érhető el:
https://www.figma.com/design/6Sfcfak6pxeAkFoFLjsLJA/BookHunt?m=auto&t=BsCw4jXg10MAnhda-6

## Technológiai stack

**Backend**
- Node.js + Express
- Prisma ORM (MySQL)
- JWT + bcryptjs hitelesítéshez
- Swagger (swagger-jsdoc + swagger-ui-express) az API dokumentációhoz

**Frontend**
- React + TypeScript (Vite)
- Egyedi CSS, sötét/világos téma támogatással

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
node prisma/seed.js

node src/server.js
```

```bash
cd frontend
npm i
npm run dev
```

API dokumentáció: `http://localhost:5000/api-docs`

## Jelenlegi állapot — kb. 25%

### Kész
- GitHub repo felállítása `dev` branch munkafolyamattal
- Prisma séma megtervezve az összes modellel és kapcsolattal
- Teljes MySQL adatbázis migrációkkal és seed adatokkal
- Express backend működő REST API útvonalakkal:
  - `POST /api/auth/register` + `POST /api/auth/login` (JWT autentikáció)
  - Teljes CRUD: Products, Webshops, Prices, Favorites, Notes, Searches, Reviews
  - GET by ID minden erőforráshoz
- Swagger dokumentáció minden végponthoz
- Frontend React + TypeScript-tel:
  - Főoldal animált carousellel és keresővel
  - Bejelentkezés és regisztrációs oldalak
  - Felhasználói profil oldal modállal
  - Sötét/világos téma váltó
  - Védett útvonalak