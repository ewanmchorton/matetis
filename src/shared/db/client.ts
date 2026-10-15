// Подключение к базе. Используется только в серверном коде.
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL не задан. Скопируйте .env.example в .env.local.");
}

// В режиме разработки Next.js перезагружает модули при каждом изменении.
// Храним одно подключение в globalThis, чтобы не открывать новые без конца.
const globalForDb = globalThis as unknown as { matetisPool?: Pool };
const pool = globalForDb.matetisPool ?? new Pool({ connectionString: databaseUrl });
if (process.env.NODE_ENV !== "production") globalForDb.matetisPool = pool;

export const db = drizzle(pool, { schema });
