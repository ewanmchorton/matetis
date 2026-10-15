// Помощники для тестов: очистка базы и тестовые люди.
import { randomUUID } from "node:crypto";

import { sql } from "drizzle-orm";

import { db, user } from "@/shared/db";

/** Удаляет всех людей и всё, что к ним привязано. */
export async function clearDatabase() {
  await db.execute(sql`truncate table "user" cascade`);
}

/** Создаёт человека напрямую в базе, минуя регистрацию. */
export async function createPerson(name: string) {
  const id = randomUUID();
  await db.insert(user).values({
    id,
    name,
    email: `${id}@test.local`,
    consentedAt: new Date(),
  });
  return id;
}
