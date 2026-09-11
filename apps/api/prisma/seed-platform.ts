import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const LOCAL_FALLBACK_EMAIL = "root@quizzeira.local";
const LOCAL_FALLBACK_PASSWORD = "Password123!";

export async function seedPlatform(client: PrismaClient): Promise<void> {
  const email =
    process.env.DEV_ROOT_EMAIL?.trim() ||
    (process.env.NODE_ENV === "production" ? "" : LOCAL_FALLBACK_EMAIL);
  const password =
    process.env.DEV_ROOT_PASSWORD?.trim() ||
    (process.env.NODE_ENV === "production" ? "" : LOCAL_FALLBACK_PASSWORD);

  if (!email || !password) {
    throw new Error(
      "DEV_ROOT_EMAIL and DEV_ROOT_PASSWORD are required for platform bootstrap",
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await client.user.findUnique({ where: { email } });
  if (!existing) {
    await client.user.create({
      data: {
        email,
        passwordHash,
        displayName: "Root",
        role: "ADMIN",
      },
    });
  } else {
    await client.user.update({
      where: { email },
      data: { passwordHash, displayName: "Root", role: "ADMIN" },
    });
  }
  console.log(`Platform seed complete: admin=${email}`);
}
