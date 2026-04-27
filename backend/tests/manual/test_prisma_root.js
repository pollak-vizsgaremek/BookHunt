import { PrismaClient } from './generated/prisma/index.js';

const prisma = new PrismaClient();

async function test() {
  try {
    const newBookmark = await prisma.konyvjelzo.create({
      data: {
        felhasznalo_id: 999, // Fake user ID
        konyv_id: "test1234",
        cim: "Mass Effect",
        szerzo: "Unknown",
        boritokep_url: "http://example.com/img.jpg",
        oldalszam: 0,
        idezet: ""
      }
    });
    console.log("Success:", newBookmark);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
