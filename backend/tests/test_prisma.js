import { PrismaClient } from "./generated/prisma/index.js";
const prisma = new PrismaClient();
async function main() {
  try {
    const items = await prisma.wishlist.findMany();
    console.log("Success:", items);
  } catch (e) {
    console.error("Error:", e);
  }
}
main();
