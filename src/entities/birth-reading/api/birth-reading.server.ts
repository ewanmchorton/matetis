// Сохранение и чтение расчёта по дате рождения. Только серверный код.
// Расчёт видят только сам человек и администратор. Проверку входа делает вызывающий код.
import { eq } from "drizzle-orm";

import { birthReading, db, user } from "@/shared/db";
import { AppError } from "@/shared/lib/app-error";

import { calculateBirthSquare, digits, scoreElements, type DigitCounts, type ElementScore } from "../model/calculate";

export type BirthReading = {
  /** ГГГГ-ММ-ДД */
  birthDate: string;
  digitCounts: DigitCounts;
  /** Стихии в порядке круга Усин, начиная с Земли. */
  elements: ElementScore[];
};

type BirthReadingRow = typeof birthReading.$inferSelect;

function toDigitColumns(counts: DigitCounts) {
  return {
    digit1: counts[1],
    digit2: counts[2],
    digit3: counts[3],
    digit4: counts[4],
    digit5: counts[5],
    digit6: counts[6],
    digit7: counts[7],
    digit8: counts[8],
    digit9: counts[9],
  };
}

function toReading(row: BirthReadingRow): BirthReading {
  const digitCounts = Object.fromEntries(
    digits.map((digit) => [digit, row[`digit${digit}`]]),
  ) as DigitCounts;
  return { birthDate: row.birthDate, digitCounts, elements: scoreElements(digitCounts) };
}

async function findReading(personId: string) {
  const [row] = await db.select().from(birthReading).where(eq(birthReading.userId, personId)).limit(1);
  return row ? toReading(row) : null;
}

/** Сохранить свою дату рождения и расчёт по ней. Повторная дата перезаписывает прежнюю. */
export async function saveMyBirthDate(viewerId: string, birthDate: unknown): Promise<BirthReading> {
  if (typeof birthDate !== "string") throw new AppError("invalid_birth_date", "Укажите настоящую дату рождения");
  const { digitCounts } = calculateBirthSquare(birthDate);
  const values = { birthDate, ...toDigitColumns(digitCounts), calculatedAt: new Date() };

  const [row] = await db
    .insert(birthReading)
    .values({ userId: viewerId, ...values })
    .onConflictDoUpdate({ target: birthReading.userId, set: values })
    .returning();
  return toReading(row);
}

export async function getMyBirthReading(viewerId: string): Promise<BirthReading | null> {
  return findReading(viewerId);
}

/** Расчёт любого человека — только для администратора. */
export async function getBirthReadingForAdmin(
  adminId: string,
  personId: string,
): Promise<BirthReading | null> {
  const [viewer] = await db.select({ role: user.role }).from(user).where(eq(user.id, adminId)).limit(1);
  if (viewer?.role !== "admin") throw new AppError("forbidden", "Доступно только администратору");
  return findReading(personId);
}
