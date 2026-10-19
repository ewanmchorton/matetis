// Сохранение прохождений теста и тип человека. Только серверный код.
// Тип видят только сам человек и администратор. Проверку входа делает вызывающий код.
import { desc, eq } from "drizzle-orm";

import { getPersonTypeByCode, type PersonType } from "@/entities/person-type";
import { assertAdmin } from "@/shared/auth/assert-admin";
import { db, typeTestAttempt } from "@/shared/db";
import { AppError } from "@/shared/lib/app-error";

export type TypeTestAnswers = {
  /** «А», «В» или «С» */
  group1: string;
  /** «1»–«4» */
  group2: string;
};

export type TypeTestAttempt = {
  takenAt: Date;
  type: PersonType;
};

function typeFor(group1: unknown, group2: unknown): PersonType {
  const type = typeof group1 === "string" && typeof group2 === "string" && getPersonTypeByCode(group1 + group2);
  if (!type) throw new AppError("invalid_test_answers", "Выберите по одному описанию в каждой группе");
  return type;
}

/** Сохранить новое прохождение теста. Прежние прохождения остаются в истории. */
export async function saveMyTypeTest(viewerId: string, answers: Partial<Record<keyof TypeTestAnswers, unknown>>) {
  const type = typeFor(answers.group1, answers.group2);
  const [row] = await db
    .insert(typeTestAttempt)
    .values({ userId: viewerId, group1Code: type.code[0], group2Code: type.code.slice(1) })
    .returning({ takenAt: typeTestAttempt.takenAt });
  return { takenAt: row.takenAt, type };
}

async function attemptsOf(personId: string, limit?: number): Promise<TypeTestAttempt[]> {
  const query = db
    .select({
      group1Code: typeTestAttempt.group1Code,
      group2Code: typeTestAttempt.group2Code,
      takenAt: typeTestAttempt.takenAt,
    })
    .from(typeTestAttempt)
    .where(eq(typeTestAttempt.userId, personId))
    .orderBy(desc(typeTestAttempt.takenAt), desc(typeTestAttempt.id));
  const rows = limit ? await query.limit(limit) : await query;
  return rows.map((row) => ({ takenAt: row.takenAt, type: typeFor(row.group1Code, row.group2Code) }));
}

/** Текущий тип — по последнему прохождению. null, если тест ещё не пройден. */
export async function getMyCurrentType(viewerId: string): Promise<PersonType | null> {
  const [latest] = await attemptsOf(viewerId, 1);
  return latest?.type ?? null;
}

/** Все прохождения человека, новые сверху. Только для администратора. */
export async function getTypeTestHistoryForAdmin(adminId: string, personId: string) {
  await assertAdmin(adminId);
  return attemptsOf(personId);
}
