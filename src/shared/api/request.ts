// Запрос к серверу приложения из браузера. Ошибка содержит понятный текст и код ответа.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export type RequestError = Error & { status?: number };

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${basePath}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : "Не получилось. Проверьте интернет и попробуйте ещё раз";
    throw Object.assign(new Error(message), { status: response.status }) as RequestError;
  }
  return body as T;
}
