import bcrypt from "bcryptjs";
import type { UserDto } from "@quizzeira/shared";
import { prisma } from "../lib/prisma";
import { toUserDto } from "../utils/user-dto";
import {
  studyUserCreateData,
  validateStudyUserCredentials,
} from "./admin-users-helpers";

export type CreateStudyUserInput = {
  email?: string;
  password?: string;
  displayName?: string;
  /** Ignored — admin create always provisions study-only USER accounts. */
  role?: string;
};

export type CreateStudyUserResult =
  | { ok: true; user: UserDto }
  | { ok: false; status: 400 | 409; error: string };

export type AdminUserListItem = UserDto & { createdAt: Date };

export { studyUserCreateData, validateStudyUserCredentials };

export async function createStudyUser(
  input: CreateStudyUserInput,
): Promise<CreateStudyUserResult> {
  const validationError = validateStudyUserCredentials(input.email, input.password);
  if (validationError) {
    return { ok: false, status: 400, error: validationError };
  }

  const email = input.email!.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, status: 409, error: "Email already registered" };
  }

  const passwordHash = await bcrypt.hash(input.password!, 10);
  const user = await prisma.user.create({
    data: studyUserCreateData({
      email,
      passwordHash,
      displayName: input.displayName?.trim() || null,
    }),
  });

  return { ok: true, user: toUserDto(user) };
}

export async function listAdminUsers(): Promise<{ items: AdminUserListItem[] }> {
  const items = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return { items };
}
