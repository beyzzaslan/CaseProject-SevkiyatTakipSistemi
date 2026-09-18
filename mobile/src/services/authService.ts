import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '../types/auth';

import { apiPost } from './api';

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