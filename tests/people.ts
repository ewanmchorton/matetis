// Помощники для тестов: очистка базы и тестовые люди.
import { randomUUID } from "node:crypto";

import { sql } from "drizzle-orm";

import type { PersonRole } from "@/shared/auth/roles";
import { db, user } from "@/shared/db";

/** Удаляет всех людей, всё, что к ним привязано, и периоды доступа. */
export async function clearDatabase() {
  await db.execute(sql`truncate table "user", access_period cascade`);
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
