import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";

// Load environment variables
dotenv.config();

const app = express()
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.send(`
    <h1>The server is running!</h1>
    <p>Server time: ${new Date().toISOString()}</p>
    <p>Available endpoints:</p>
    <ul>
      <li><a href="/">/</a> - Go back</li>
    </ul>
  `);
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Root: provide basic info, routing
app.use("/", (req, res) => {
  res.send(`
    <h1>BookHunt API</h1>
    <p>Available endpoints:</p>
    <ul>
      <li><a href="/api/auth">/api/auth</a> - Authentication routes (register, login, me)</li>
      <li><a href="/api/health">/api/health</a> - Health check endpoint</li>
      <li><a href="/api/users">/api/users</a> - Get all users</a></li>
      <li><a href="/api/webshops">/api/webshops</a> - Get all webshops</a></li>
      <li><a href="/api/products">/api/products</a> - Get all products</a></li>
      <li><a href="/api/price-history">/api/price-history</a> - Get all price history</a></li>
    </ul>
  `);
});

// Start server
app.listen(port, () => {
  console.log(`BookHunt server running on http://localhost:${port}`);
  console.log(`API endpoints available at http://localhost:${port}/api`);
});

// Update user profile

/* 
model Felhasznalo {
  felhasznalo_id  Int      @id @default(autoincrement())
  jelszo         String
  email          String   @unique
  felhasznalonev String   @unique
  profilkep       String? // opcionális

  @@index([email], name: "idx_email")
  @@index([felhasznalonev], name: "idx_felhasznalonev")
  Keres Keres[]
  Kedvencek Kedvencek[]
}
*/

// get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await prisma.felhasznalo.findMany({
      select: {
        felhasznalo_id: true,
        email: true,
        felhasznalonev: true,
        profilkep: true,
      },
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.put("/api/auth/profile", async (req, res) => {
  try {
    const { userId } = req.user; // auth.js req.user
    const { profilkep } = req.body;

    // Update the user's profile picture
    const updatedUser = await prisma.felhasznalo.update({
      where: { felhasznalo_id: userId },
      data: { profilkep },
    });

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.felhasznalo_id,
        username: updatedUser.felhasznalonev,
        email: updatedUser.email,
        profilkep: updatedUser.profilkep,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Profile update failed" });
  }
});

// manually upload webshop 

/*
model WebAruhaz {
  webaruhaz_id Int    @id @default(autoincrement())
  url          String @unique
  nev          String

  @@index([url], name: "idx_url")
  Keres Keres[]
  Feljegyzes Feljegyzes[]
  Arak Arak[]
}
*/

app.post("/api/webshop", async (req, res) => {
  try {
    const { url, nev } = req.body;

    const webshop = await prisma.webAruhaz.create({
      data: {
        url,
        nev,
      },
    });

    res.status(201).json({
      message: "Webshop added successfully",
      webshop: {
        id: webshop.wearuhaz_id,
        url: webshop.url,
        nev: webshop.nev,
      },
    });
  } catch (error) {
    console.error("Webshop creation error:", error);
    res.status(500).json({ error: "Webshop creation failed" });
  }
});

// get all webshops
app.get("/api/webshops", async (req, res) => {
  try {
    const webshops = await prisma.webAruhaz.findMany({
      select: {
        wearuhaz_id: true,
        url: true,
        nev: true,
      },
    });
    res.json(webshops);
  } catch (error) {
    console.error("Error fetching webshops:", error);
    res.status(500).json({ error: "Failed to fetch webshops" });
  }
});

/* model Termek {
  termek_id Int    @id @default(autoincrement())
  cim       String @db.VarChar(500)
  tipus     Tipus // enum!
  szerzo    String? @db.VarChar(255)
  isbn_issn String? @db.VarChar(20)
  boritokep String? @db.VarChar(500)

  @@index([tipus], name: "idx_tipus")
  @@index([szerzo], name: "idx_szerzo")
  @@index([isbn_issn], name: "idx_isbn_issn")
  Kedvencek Kedvencek[]
  Feljegyzes Feljegyzes[]
}

enum Tipus {
  konyv
  e_konyv
  manga
  kepregeny
  hangoskonyv
} */

// manually post product
app.post("/api/product", async (req, res) => {
  try {
    const { cim, tipus, szerzo, isbn_issn, boritokep } = req.body;

    const product = await prisma.termek.create({
      data: {
        cim,
        tipus,
        szerzo,
        isbn_issn,
        boritokep,
      },
    });

    res.status(201).json({
      message: "Product added successfully",
      product: {
        id: product.termek_id,
        cim: product.cim,
        tipus: product.tipus,
        szerzo: product.szerzo,
        isbn_issn: product.isbn_issn,
        boritokep: product.boritokep,
      },
    });
  } catch (error) {
    console.error("Product creation error:", error);
    res.status(500).json({ error: "Product creation failed" });
  }
});

// get all products

app.get("/api/products", async (req, res) => {
  try {
    const products = await prisma.termek.findMany({
      select: {
        termek_id: true,
        cim: true,
        tipus: true,
        szerzo: true,
        isbn_issn: true,
        boritokep: true,
      },
    });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

/*model Ar_Tortenet {
  ar_id        Int      @id @default(autoincrement())
  feljegyzes_id Int
  ar           Decimal  @db.Decimal(10, 2)
  datum        DateTime @default(now())

  Feljegyzes  Feljegyzes @relation(fields: [feljegyzes_id], references: [feljegyzes_id], onDelete: Cascade, onUpdate: Cascade)

  @@index([feljegyzes_id], name: "idx_feljegyzes")
  @@index([datum], name: "idx_datum")
} */

// get price history
app.get("/api/price-history", async (req, res) => {
  try {
    const priceHistory = await prisma.ar_Tortenet.findMany({
      select: {
        ar_id: true,
        feljegyzes_id: true,
        ar: true,
        datum: true,
      },
    });
    res.json(priceHistory);
  } catch (error) {
    console.error("Error fetching price history:", error);
    res.status(500).json({ error: "Failed to fetch price history" });
  }
});