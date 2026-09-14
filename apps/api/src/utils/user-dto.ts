import type { UserDto } from "@quizzeira/shared";

export function toUserDto(user: {
  id: string;
  email: string;
  displayName: string | null;
  role: "USER" | "ADMIN";
}): UserDto {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
}
