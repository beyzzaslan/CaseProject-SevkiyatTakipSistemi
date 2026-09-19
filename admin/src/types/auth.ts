export type UserRole = "DRIVER" | "ADMIN";

export type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};