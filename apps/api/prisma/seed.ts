import { PrismaClient } from "@prisma/client";
import { seedPlatform } from "./seed-platform";

const prisma = new PrismaClient();

async function main() {
  await seedPlatform(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
