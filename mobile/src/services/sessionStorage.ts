import * as SecureStore from "expo-secure-store";

import type { AuthResponse } from "../types/auth";

const AUTH_SESSION_KEY = "factory_queue_auth_session";

export async function saveSession(
  session: AuthResponse,
): Promise<void> {
  await SecureStore.setItemAsync(
    AUTH_SESSION_KEY,
    JSON.stringify(session),
  );
}

export async function getSession(): Promise<AuthResponse | null> {
  const storedSession = await SecureStore.getItemAsync(
    AUTH_SESSION_KEY,
  );

  if (!storedSession) {
    return null;
  }

  try {
    return JSON.parse(storedSession) as AuthResponse;
  } catch {
    await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
}