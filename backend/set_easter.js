import { PrismaClient } from './generated/prisma/index.js';
const prisma = new PrismaClient();
prisma.globalSettings.update({ where: { id: 1 }, data: { theme: 'easter' } })
  .then(console.log)
  .finally(() => prisma.$disconnect());
