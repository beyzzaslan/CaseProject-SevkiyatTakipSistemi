const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:3000/api";

type ApiErrorResponse = {
  message?: string;
};

export class ApiError extends Error {
  readonly status: number;

  constructor(
    status: number,
    message: string,
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    },
  );

  const responseBody = (await response
    .json()
    .catch(() => null)) as ApiErrorResponse | null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      responseBody?.message ??
        "Sunucuyla iletişim kurulamadı.",
    );
  }

  return responseBody as T;
}