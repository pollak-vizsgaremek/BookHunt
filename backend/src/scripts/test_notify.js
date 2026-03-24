import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  const targetIsbn = "PKEY:T2273500035001";
  console.log(`Searching for wishlist items with ISBN: ${targetIsbn}`);

  const wishlists = await prisma.wishlist.findMany({
    where: { isbn: targetIsbn }
  });

  if (wishlists.length === 0) {
    console.log("No wishlist items found. Testing against ALL wishlists just to trigger ANY alert.");
    // Fetch ANY wishlist item so the user sees a result
    const anyItem = await prisma.wishlist.findFirst();
    if (!anyItem) {
      console.log("No wishlists exist inside the database at all.");
      return;
    }
    await triggerNotification(anyItem.felhasznalo_id, anyItem.title, 5.00);
  } else {
    for (const item of wishlists) {
      await triggerNotification(item.felhasznalo_id, item.title, 12.99);
    }
  }
}

async function triggerNotification(userId, title, price) {
  console.log(`Creating test notification for User ${userId}...`);
  await prisma.notification.create({
    data: {
      felhasznalo_id: userId,
      szoveg: `Test Alert! '${title}' has dropped to ${price} HUF! This is a manual price adjustment alert.`
    }
  });
  console.log("Success.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
