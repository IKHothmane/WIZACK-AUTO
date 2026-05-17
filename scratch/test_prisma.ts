import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function main() {
  console.log("Testing Prisma connectivity...");
  try {
    const productsCount = await prisma.product.count();
    console.log(`Products count: ${productsCount}`);
    
    const categoriesCount = await prisma.category.count();
    console.log(`Categories count: ${categoriesCount}`);
    
    const brandsCount = await prisma.brand.count();
    console.log(`Brands count: ${brandsCount}`);
  } catch (e) {
    console.error("Prisma error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
