// Тестовые записи журнала для профиля Вани (Telegram @ivanmahortov).
// Тексты те же, что на GitHub Pages: src/views/profile/model/journal.ts.
// Уже написанную в этот день заметку не затирает. Повторный запуск ничего не дублирует.
// Запуск: pnpm db:seed-journal
import pg from "pg";

import { demoJournal } from "../src/views/profile/model/journal.ts";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Файла нет – берём DATABASE_URL из окружения.
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL не задан.");
  process.exit(1);
}

const db = new pg.Client({ connectionString: databaseUrl });
await db.connect();
try {
  const person = await db.query(`select id, name from "user" where telegram_username = 'ivanmahortov'`);
  const user = person.rows[0] as { id: string; name: string } | undefined;
  if (!user) {
    console.error("В базе нет человека с Telegram @ivanmahortov.");
    process.exit(1);
  }
  const practice = await db.query(
    `select id from practice where title = 'Мышление по навигатору дня' order by created_at limit 1`,
  );
  const practiceId = (practice.rows[0] as { id: string } | undefined)?.id;
  if (!practiceId) {
    console.error("В базе нет практики «Мышление по навигатору дня». Сначала pnpm db:seed-program.");
    process.exit(1);
  }
  let added = 0;
  for (const note of demoJournal) {
    const saved = await db.query(
      `insert into practice_note (user_id, practice_id, day, text)
       values ($1, $2, $3, $4)
       on conflict (user_id, practice_id, day) do nothing
       returning day`,
      [user.id, practiceId, note.day, note.text],
    );
    added += saved.rowCount ?? 0;
  }
  console.log(`${user.name}: добавлено записей журнала – ${added}, уже было – ${demoJournal.length - added}.`);
} finally {
  await db.end();
}
