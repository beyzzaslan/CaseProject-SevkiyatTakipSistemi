import type {
  AuthUser,
  LoginResponse,
} from "../types/auth";
import {
  ApiError,
  apiRequest,
} from "./api";

export async function loginAdmin(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    },
  );

  if (response.user.role !== "ADMIN") {
    throw new ApiError(
      403,
      "Bu panel yalnızca admin kullanıcıları içindir.",
    );
  }

  return response;
}

type CurrentUserResponse = {
  user: AuthUser;
};

export async function getCurrentAdmin(
  token: string,
): Promise<AuthUser> {
  const response =
    await apiRequest<CurrentUserResponse>(
      "/auth/me",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

  if (response.user.role !== "ADMIN") {
    throw new ApiError(
      403,
      "Bu panel yalnızca admin kullanıcıları içindir.",
    );
  }

  return response.user;
}