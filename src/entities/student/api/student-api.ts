import type { Student } from "../model/types";

// Выдуманные ученики для демонстрации админки.
const students: Student[] = [
  { id: "s1", name: "Анна Смирнова", email: "anna@example.ru", typeId: "t7", registeredAt: "2026-09-14", practicesThisWeek: 3 },
  { id: "s2", name: "Ирина Ковалёва", email: "irina.k@example.ru", typeId: "t1", registeredAt: "2026-09-16", practicesThisWeek: 5 },
  { id: "s3", name: "Дмитрий Орлов", email: "d.orlov@example.ru", typeId: "t3", registeredAt: "2026-09-20", practicesThisWeek: 1 },
  { id: "s4", name: "Мария Лебедева", email: "maria.l@example.ru", typeId: "t5", registeredAt: "2026-09-22", practicesThisWeek: 4 },
  { id: "s5", name: "Олег Никитин", email: "oleg.n@example.ru", typeId: "t11", registeredAt: "2026-09-25", practicesThisWeek: 0 },
  { id: "s6", name: "Елена Волкова", email: "e.volkova@example.ru", typeId: "t2", registeredAt: "2026-09-28", practicesThisWeek: 2 },
  { id: "s7", name: "Светлана Морозова", email: "sveta.m@example.ru", typeId: "t9", registeredAt: "2026-10-01", practicesThisWeek: 3 },
  { id: "s8", name: "Алексей Павлов", email: "a.pavlov@example.ru", typeId: "t12", registeredAt: "2026-10-03", practicesThisWeek: 1 },
];

export function getStudents(): Student[] {
  return students;
}
