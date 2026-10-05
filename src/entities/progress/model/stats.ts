import { toDateKey } from "@/shared/lib/date";

export function countPracticesInWeek(completedDays: string[], weekDays: Date[]): number {
  const week = new Set(weekDays.map(toDateKey));
  return completedDays.filter((d) => week.has(d)).length;
}

/** Короткая фраза на экране программы — без серий и давления. */
export function getSoftProgramNote(completedDays: string[], weekDays: Date[]): string {
  const thisWeek = countPracticesInWeek(completedDays, weekDays);
  const total = completedDays.length;

  if (total === 0) {
    return "Когда будет удобно — начните с практики дня. Спешки нет.";
  }
  if (thisWeek > 0) {
    return `На этой неделе вы уже находили время для практики — это ваш ритм, без сравнения с другими.`;
  }
  return "Вы уже отмечали практики раньше — подробнее можно посмотреть в профиле.";
}

function pluralPractice(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "раз";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "раза";
  return "раз";
}

/** Развёрнутая, но мягкая статистика для профиля. */
export function getProfileStatsSummary(
  completedDays: string[],
  weekDays: Date[],
): { lines: string[] } {
  const total = completedDays.length;
  const thisWeek = countPracticesInWeek(completedDays, weekDays);

  const lines: string[] = [
    `Практика дня отмечена ${total} ${pluralPractice(total)} — каждый раз по вашему желанию, без «обязаловки».`,
  ];

  if (thisWeek > 0) {
    lines.push(
      `На этой неделе — ${thisWeek} ${pluralPractice(thisWeek)}. Можно делать меньше или больше: важен бережный контакт с собой.`,
    );
  } else {
    lines.push("На этой неделе практика ещё не отмечалась — это нормально, если вы отдыхаете.");
  }

  lines.push("Мы не считаем серии «дней подряд», чтобы не подсаживать на тревожные страйки.");

  return { lines };
}
