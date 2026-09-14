/** Shared credential rules with public /auth/register. */
export function validateStudyUserCredentials(
  email?: string,
  password?: string,
): string | null {
  if (!email?.trim() || !password || password.length < 6) {
    return "Email and password (min 6 chars) required";
  }
  return null;
}

/** Always forces role USER so clients cannot escalate via body.role. */
export function studyUserCreateData(args: {
  email: string;
  passwordHash: string;
  displayName: string | null;
}): { email: string; passwordHash: string; displayName: string | null; role: "USER" } {
  return {
    email: args.email,
    passwordHash: args.passwordHash,
    displayName: args.displayName,
    role: "USER",
  };
}
