import { getPersonTypeByCode, type PersonType } from "@/entities/person-type";
import type { TypeTest } from "@/entities/type-test";

/** Ответы: id группы → id выбранного раздела */
export type TestAnswers = Record<string, string>;

/**
 * Тип = код раздела из группы 1 (А/В/С) + код раздела из группы 2 (1–4),
 * например «А3» — Лидер. Правило взято из черновиков Мастера.
 */
export function calculateType(test: TypeTest, answers: TestAnswers): PersonType | undefined {
  const code = test.groups
    .map((g) => g.sections.find((s) => s.id === answers[g.id])?.code ?? "")
    .join("");
  return getPersonTypeByCode(code);
}
