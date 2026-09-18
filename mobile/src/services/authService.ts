import { apiGet, apiPost } from "./api";

import type {
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from "../types/auth";

export function register(
  request: RegisterRequest,
): Promise<AuthResponse> {
  return apiPost<AuthResponse>(
    '/auth/register',
    request,
  );
}

export function login(
  request: LoginRequest,
): Promise<AuthResponse> {
  return apiPost<AuthResponse>(
    '/auth/login',
    request,
  );
}

type CurrentUserResponse = {
  user: AuthUser;
};

export async function getCurrentUser(
  token: string,
): Promise<AuthUser> {
  const response = await apiGet<CurrentUserResponse>(
    "/auth/me",
    token,
  );

  return response.user;
}