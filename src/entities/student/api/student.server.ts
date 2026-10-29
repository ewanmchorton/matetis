// Ученики для администратора: список людей и карточка одного человека. Только серверный код.
import { asc, desc, eq } from "drizzle-orm";

import { getPersonTypeByCode } from "@/entities/person-type";
import { assertAdmin } from "@/shared/auth/assert-admin";
import { contactOf } from "@/shared/auth/contact";
import { birthReading, db, typeTestAttempt, user } from "@/shared/db";

export type StudentSummary = {
  id: string;
  name: string;
  /** Почта или ник в Telegram. */
  contact: string | null;
  registeredAt: Date;
  /** Название текущего типа или null, если тест не пройден. */
  typeName: string | null;
  hasBirthDate: boolean;
};

export type StudentCard = { id: string; name: string; contact: string | null; registeredAt: Date };

const personColumns = {
  id: user.id,
  name: user.name,
  email: user.email,
  telegramId: user.telegramId,
  telegramUsername: user.telegramUsername,
  registeredAt: user.createdAt,
};

/** Все зарегистрированные люди, кроме администраторов, новые сверху. */
export async function listStudentsForAdmin(adminId: string): Promise<StudentSummary[]> {
  await assertAdmin(adminId);
  const [people, latestTests, readings] = await Promise.all([
    db
      .select(personColumns)
      .from(user)
      .where(eq(user.role, "user"))
      .orderBy(desc(user.createdAt)),
    db
      .selectDistinctOn([typeTestAttempt.userId], {
        userId: typeTestAttempt.userId,
        code: typeTestAttempt.group1Code,
        code2: typeTestAttempt.group2Code,
      })
      .from(typeTestAttempt)
      .orderBy(asc(typeTestAttempt.userId), desc(typeTestAttempt.takenAt)),
    db.select({ userId: birthReading.userId }).from(birthReading),
  ]);

  const typeByPerson = new Map(
    latestTests.map((test) => [test.userId, getPersonTypeByCode(test.code + test.code2)?.name ?? null]),
  );
  const withBirthDate = new Set(readings.map((reading) => reading.userId));
  return people.map((person) => ({
    id: person.id,
    name: person.name,
    contact: contactOf(person),
    registeredAt: person.registeredAt,
    typeName: typeByPerson.get(person.id) ?? null,
    hasBirthDate: withBirthDate.has(person.id),
  }));
}

/** Имя, почта или ник в Telegram и дата регистрации человека. null, если такого нет. */
export async function getStudentForAdmin(adminId: string, personId: string): Promise<StudentCard | null> {
  await assertAdmin(adminId);
  const [person] = await db
    .select(personColumns)
    .from(user)
    .where(eq(user.id, personId))
    .limit(1);
  if (!person) return null;
  return { id: person.id, name: person.name, contact: contactOf(person), registeredAt: person.registeredAt };
}
