import type { Student } from "../model/types";

const raw: [string, string, string | null, string, number, number][] = [
  ["Анна Смирнова", "anna@example.ru", "t7", "2026-10-05", 10, 3],
  ["Мария Кузнецова", "maria@example.ru", "t3", "2026-10-04", 9, 2],
  ["Екатерина Попова", "kate@example.ru", "t1", "2026-10-05", 12, 4],
  ["Ольга Васильева", "olga@example.ru", "t9", "2026-09-28", 3, 1],
  ["Ирина Морозова", "irina@example.ru", "t7", "2026-10-03", 8, 3],
  ["Дмитрий Волков", "dmitry@example.ru", "t6", "2026-10-01", 6, 2],
  ["Светлана Новикова", "sveta@example.ru", "t12", "2026-10-05", 11, 4],
  ["Наталья Фёдорова", "natalia@example.ru", null, "2026-09-30", 0, 0],
  ["Алексей Соколов", "alex@example.ru", "t5", "2026-09-22", 2, 0],
  ["Юлия Лебедева", "julia@example.ru", "t2", "2026-10-02", 7, 3],
  ["Татьяна Козлова", "tanya@example.ru", "t11", "2026-10-04", 9, 3],
  ["Елена Новак", "elena@example.ru", "t4", "2026-09-25", 4, 1],
];

const students: Student[] = raw.map(([name, email, typeId, last, done, rituals], i) => ({
  id: `s${i + 1}`,
  name,
  email,
  typeId,
  registeredAt: "2026-09-23",
  lastActiveAt: last,
  practicesDone: done,
  practicesTotal: 12,
  ritualsDone: rituals,
  ritualsTotal: 4,
}));

export function getStudents(): Student[] {
  return students;
}

export function getStudent(id: string): Student | undefined {
  return students.find((s) => s.id === id);
}

/** Сводные цифры для общей статистики (в демо часть цифр «нарисована»). */
export function getAdminOverview() {
  const started = students.filter((s) => s.practicesDone > 0);
  const active = students.filter((s) => s.lastActiveAt >= "2026-09-29");
  const avg = started.reduce((sum, s) => sum + s.practicesDone, 0) / (started.length || 1);
  const ritualsRate =
    students.reduce((sum, s) => sum + s.ritualsDone, 0) /
    students.reduce((sum, s) => sum + s.ritualsTotal, 0);

  const byType = new Map<string, number>();
  for (const { typeId } of students) {
    if (typeId) byType.set(typeId, (byType.get(typeId) ?? 0) + 1);
  }

  return {
    registered: students.length,
    active: active.length,
    startedPercent: Math.round((started.length / students.length) * 100),
    avgPractices: Math.round(avg * 10) / 10,
    ritualsPercent: Math.round(ritualsRate * 100),
    byType,
  };
}
