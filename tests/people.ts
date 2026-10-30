// Помощники для тестов: очистка базы и тестовые люди.
import { randomUUID } from "node:crypto";

import { sql } from "drizzle-orm";

import type { PersonRole } from "@/shared/auth/roles";
import { db, user } from "@/shared/db";

/** Удаляет всех людей, всё, что к ним привязано, запросы входа, периоды доступа, отметки о напоминаниях, фразы дня, переходы на Металл, практики и послания. */
export async function clearDatabase() {
  await db.execute(sql`truncate table "user", verification, access_period, access_expiry_reminder, daily_phrase, metal_start, practice, navigator_message cascade`);
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
