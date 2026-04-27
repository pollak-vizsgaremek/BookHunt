import { PrismaClient } from "./backend/generated/prisma/index.js";
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.forumBejegyzes.count();
  console.log("ForumBejegyzes count:", count);
  const posts = await prisma.forumBejegyzes.findMany({ take: 5 });
  console.log("Recent posts:", JSON.stringify(posts, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
