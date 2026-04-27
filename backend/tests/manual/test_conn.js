
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function testConn() {
  try {
    await prisma.$connect();
    console.log('Successfully connected to the database');
    const userCount = await prisma.felhasznalo.count();
    console.log('User count:', userCount);
  } catch (err) {
    console.error('Connection error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testConn();
