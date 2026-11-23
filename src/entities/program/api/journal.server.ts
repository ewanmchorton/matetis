// Журнал профиля: заметки человека к «Мышлению по навигатору». Только серверный код.
// Видит только сам человек, как и сами заметки.
import { desc, eq } from "drizzle-orm";

import { db, practiceNote } from "@/shared/db";

export type JournalNote = { day: string; text: string };

/** Заметки от новых к старым. */
export async function listMyJournal(userId: string): Promise<JournalNote[]> {
  return db
    .select({ day: practiceNote.day, text: practiceNote.text })
    .from(practiceNote)
    .where(eq(practiceNote.userId, userId))
    .orderBy(desc(practiceNote.day), desc(practiceNote.updatedAt));
}
