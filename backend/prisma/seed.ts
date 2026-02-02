import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  const WebAruhaz = await prisma.webAruhaz.createMany({
    data: [
      { url: "https://www.libri.hu", nev: "Libri Könyvesbolt" },
      { url: "https://www.bookline.hu", nev: "Bookline" },
      { url: "https://www.amazon.com", nev: "Amazon" },
      { url: "https://www.libristo.hu", nev: "Libristo" },
    ],
    skipDuplicates: true,
  });

  const Termek = await prisma.Termek.createMany({
    data: [
      {
        cim: "A Gyűrűk Ura",
        tipus: "konyv",
        szerzo: "J.R.R. Tolkien",
        isbn_issn: "9789632451234",
      },
      {
        cim: "Harry Potter és a bölcsek köve",
        tipus: "e_konyv",
        szerzo: "J.K. Rowling",
        isbn_issn: "9789633245678",
      },
      {
        cim: "One Piece 1. kötet",
        tipus: "manga",
        szerzo: "Eiichiro Oda",
        isbn_issn: "9789631234567",
      },
      {
        cim: "Batman: The Killing Joke",
        tipus: "kepregeny",
        szerzo: "Alan Moore",
        isbn_issn: "9781401234567",
      },
    ],
    skipDuplicates: true,
  });
    console.log("Seed finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
