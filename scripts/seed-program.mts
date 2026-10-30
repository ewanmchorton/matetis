// Начальный список практик программы: названия, утро / вечер / раз в неделю и день появления.
// Тексты, аудио и видео контент-менеджер добавит в админке.
// Запуск: pnpm db:seed-program
// Добавляет только практики, которых ещё нет (по названию): повторный запуск ничего не дублирует
// и не трогает то, что уже поменяли в админке.
import pg from "pg";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Файла нет — берём DATABASE_URL из окружения.
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL не задан.");
  process.exit(1);
}

type Seed = { title: string; frequency: "daily" | "weekly"; daypart: "morning" | "evening" | null; opensOnDay: number };

// Порядок и дни — из docs/data-model.md, раздел «3а. Программа».
const practices: Seed[] = [
  { title: "Улыбка", frequency: "daily", daypart: "morning", opensOnDay: 1 },
  { title: "Линия души", frequency: "daily", daypart: "morning", opensOnDay: 8 },
  { title: "Мини-зарядка", frequency: "daily", daypart: "morning", opensOnDay: 1 },
  { title: "Целительные звуки", frequency: "daily", daypart: "evening", opensOnDay: 4 },
  { title: "Мышление по навигатору дня", frequency: "daily", daypart: "evening", opensOnDay: 2 },
  { title: "Медитация на качество силы", frequency: "weekly", daypart: null, opensOnDay: 1 },
  { title: "Медитация на слабую стихию", frequency: "weekly", daypart: null, opensOnDay: 8 },
  { title: "Прогулка без телефона", frequency: "weekly", daypart: null, opensOnDay: 15 },
  { title: "Полный цикл зарядки", frequency: "weekly", daypart: null, opensOnDay: 1 },
];

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
try {
  let added = 0;
  for (const [index, item] of practices.entries()) {
    const result = await client.query(
      `insert into practice (title, frequency, daypart, position, opens_on_day)
       select $1, $2, $3, $4, $5 where not exists (select 1 from practice where title = $1)`,
      [item.title, item.frequency, item.daypart, index + 1, item.opensOnDay],
    );
    added += result.rowCount ?? 0;
  }
  console.log(`Практик добавлено: ${added}, уже были: ${practices.length - added}.`);
} finally {
  await client.end();
}
