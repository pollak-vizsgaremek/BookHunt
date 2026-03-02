import { PrismaClient } from "../generated/prisma/client.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  await prisma.webAruhaz.createMany({
    data: [
      { url: "https://www.libri.hu", nev: "Libri Könyvesbolt" },
      { url: "https://www.bookline.hu", nev: "Bookline" },
      { url: "https://www.amazon.com", nev: "Amazon" },
      { url: "https://www.libristo.hu", nev: "Libristo" },
    ],
    skipDuplicates: true,
  });

  await prisma.termek.createMany({
    data: [
      {
        cim: "The Great Gatsby",
        tipus: "konyv",
        szerzo: "F. Scott Fitzgerald",
        isbn_issn: "978-3-16-148410-0",
        boritokep: "https://example.com/gatsby.jpg",
      },
      {
        cim: "To Kill a Mockingbird",
        tipus: "konyv",
        szerzo: "Harper Lee",
        isbn_issn: "978-1-23-456789-0",
        boritokep: "https://example.com/mockingbird.jpg",
      },
      {
        cim: "1984",
        tipus: "konyv",
        szerzo: "George Orwell",
        isbn_issn: "978-0-12-345678-9",
        boritokep: "https://example.com/1984.jpg",
      },
    ],
    skipDuplicates: true,
  });

  const hashedTestPassword = await bcrypt.hash("password123", 10);
  await prisma.felhasznalo.upsert({
    where: { felhasznalonev: "testuser" },
    update: {},
    create: {
      felhasznalonev: "testuser",
      email: "testuser@bookhunt.com",
      jelszo: hashedTestPassword,
    },
  });

  console.log("Seed completed.");
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
