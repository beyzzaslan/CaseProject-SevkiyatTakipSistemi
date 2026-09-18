import { Platform } from 'react-native';

const API_HOST =
  Platform.OS === 'android'
    ? '10.0.2.2'
    : 'localhost';

export const API_BASE_URL = `http://${API_HOST}:3000/api`;

type ApiErrorBody = {
  message?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiPost<TResponse>(
  path: string,
  body: unknown,
): Promise<TResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      'Sunucuya ulaşılamadı. Backend bağlantısını kontrol edin.',
      0,
    );
  }

  const responseBody = (await response
    .json()
    .catch(() => null)) as ApiErrorBody | TResponse | null;

  if (!response.ok) {
    const errorMessage =
      responseBody &&
      typeof responseBody === 'object' &&
      'message' in responseBody &&
      typeof responseBody.message === 'string'
        ? responseBody.message
        : 'İstek sırasında bir hata oluştu.';

    throw new ApiError(errorMessage, response.status);
  }

  return responseBody as TResponse;
}