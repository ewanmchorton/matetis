// Применяет новые миграции из папки drizzle/ – то же, что pnpm db:migrate.
// На сервере вызывается при запуске приложения (MIGRATE_ON_START, см. src/instrumentation.ts).
import path from "node:path";

import { migrate } from "drizzle-orm/node-postgres/migrator";

import { db } from "./client";

export async function applyMigrationsOrExit() {
  try {
    await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  } catch (error) {
    // Next.js сам не останавливается при ошибке в instrumentation и продолжил бы работать со старой базой.
    console.error("Миграции не применены, приложение остановлено", error);
    process.exit(1);
  }
}
