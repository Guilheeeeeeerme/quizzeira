import { PrismaClient } from "@prisma/client";
import { seedDemo } from "./seed-demo";

const prisma = new PrismaClient();
seedDemo(prisma)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
