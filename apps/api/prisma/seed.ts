import { PrismaClient } from "@prisma/client";
import { seedPlatform } from "./seed-platform";
import { seedDemo } from "./seed-demo";

const prisma = new PrismaClient();

function wantDemo(): boolean {
  const value = (process.env.SEED_DEMO || "").trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

async function main() {
  await seedPlatform(prisma);
  if (wantDemo()) {
    await seedDemo(prisma);
  } else {
    console.log("Skipping demo seed (SEED_DEMO unset)");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
