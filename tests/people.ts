// Помощники для тестов: очистка базы и тестовые люди.
import { randomUUID } from "node:crypto";

import { sql } from "drizzle-orm";

import type { PersonRole } from "@/shared/auth/roles";
import { db, user } from "@/shared/db";

/** Удаляет людей и наполняемые таблицы, чтобы следующий тест начинал с пустой базы. */
export async function clearDatabase() {
  await db.execute(sql`truncate table "user", verification, access_period, access_expiry_reminder, daily_phrase, metal_start, practice, navigator_message, program_video, element_video_seen, element_recommendation, library_book_cover cascade`);
}

/** Создаёт человека напрямую в базе, минуя регистрацию. */
export async function createPerson(name: string, role: PersonRole = "user", email?: string) {
  const id = randomUUID();
  await db.insert(user).values({
    id,
    name,
    email: email ?? `${id}@test.local`,
    role,
    consentedAt: new Date(),
  });
  return id;
}

/** Создаёт человека, который входит через Telegram: без почты, с номером и, если задан, ником. */
export async function createTelegramPerson(name: string, telegramId: string, telegramUsername: string | null = null) {
  const id = randomUUID();
  await db.insert(user).values({ id, name, role: "user", consentedAt: new Date(), telegramId, telegramUsername });
  return id;
}
