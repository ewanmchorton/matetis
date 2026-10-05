import { toDateKey } from "@/shared/lib/date";

export function countPracticesInWeek(completedDays: string[], weekDays: Date[]): number {
  const week = new Set(weekDays.map(toDateKey));
  return completedDays.filter((d) => week.has(d)).length;
}

function pluralPracticeNoun(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "практика";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "практики";
  return "практик";
}

function pluralPracticeAcc(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "раз";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "раза";
  return "раз";
}

function encouragementForWeek(count: number): string {
  if (count === 0) {
    return "Когда будет удобно — отметьте практику дня. Каждый шаг к себе уже важен.";
  }
  if (count === 1) {
    return "Вы уже нашли время для себя — бережно и без спешки.";
  }
  if (count === 2) {
    return "Два раза на этой неделе — хороший, спокойный ритм.";
  }
  if (count === 3) {
    return "Три практики за неделю — вы заботитесь о себе, и это заметно.";
  }
  return "Вы уделяете практике внимание — в своём темпе, без сравнения с другими.";
}

/** Блок на главной «Программа»: цифра за неделю + короткие ободряющие слова. */
export function getProgramWeekHighlight(completedDays: string[], weekDays: Date[]) {
  const weekCount = countPracticesInWeek(completedDays, weekDays);
  return {
    weekCount,
    headline:
      weekCount === 0
        ? "На этой неделе пока без отметок"
        : `${weekCount} ${pluralPracticeNoun(weekCount)} на этой неделе`,
    encouragement: encouragementForWeek(weekCount),
  };
}

/** Короткая второстепенная строка под блоком (если нужна). */
export function getSoftProgramNote(completedDays: string[], weekDays: Date[]): string {
  const thisWeek = countPracticesInWeek(completedDays, weekDays);
  const total = completedDays.length;

  if (total === 0) {
    return "Подробнее — в профиле, когда захотите заглянуть.";
  }
  if (thisWeek > 0) {
    return `Всего отмечено ${total} ${pluralPracticeAcc(total)} — это ваш путь, не соревнование.`;
  }
  return "Раньше вы уже практиковали — детали в профиле.";
}

/** Развёрнутая, но мягкая статистика для профиля. */
export function getProfileStatsSummary(
  completedDays: string[],
  weekDays: Date[],
): { lines: string[] } {
  const total = completedDays.length;
  const thisWeek = countPracticesInWeek(completedDays, weekDays);

  const lines: string[] = [
    `Практика дня отмечена ${total} ${pluralPracticeAcc(total)} — каждый раз по вашему желанию, без «обязаловки».`,
  ];

  if (thisWeek > 0) {
    lines.push(
      `На этой неделе — ${thisWeek} ${pluralPracticeAcc(thisWeek)}. Можно делать меньше или больше: важен бережный контакт с собой.`,
    );
  } else {
    lines.push("На этой неделе практика ещё не отмечалась — это нормально, если вы отдыхаете.");
  }

  lines.push("Мы не считаем серии «дней подряд», чтобы не подсаживать на тревожные страйки.");

  return { lines };
}
