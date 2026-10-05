import type { TestQuestion } from "@/entities/type-test";

/**
 * Демо-правило: каждый ответ даёт балл перечисленным типам, побеждает тип с
 * наибольшей суммой. Настоящую формулу подсчёта нужно получить у Мастера.
 */
export function calculateType(
  questions: TestQuestion[],
  answers: Record<string, string>,
): string {
  const scores = new Map<string, number>();
  for (const q of questions) {
    const option = q.options.find((o) => o.id === answers[q.id]);
    option?.typeIds.forEach((t, i) => {
      scores.set(t, (scores.get(t) ?? 0) + (i === 0 ? 2 : 1));
    });
  }
  let best = "t1";
  let bestScore = -1;
  for (const [typeId, score] of scores) {
    if (score > bestScore) {
      best = typeId;
      bestScore = score;
    }
  }
  return best;
}
