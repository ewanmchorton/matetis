// Адрес тестовой базы: тот же сервер PostgreSQL, что в DATABASE_URL, но база matetis_test.
export const TEST_DATABASE_NAME = "matetis_test";

export function workDatabaseUrl(): string {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Файла нет — берём DATABASE_URL из окружения.
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL не задан. Скопируйте .env.example в .env.local.");
  return url;
}

export function testDatabaseUrl(): string {
  const url = new URL(workDatabaseUrl());
  url.pathname = `/${TEST_DATABASE_NAME}`;
  return url.toString();
}
