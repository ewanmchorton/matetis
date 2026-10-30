// Начальный список практик программы: названия, утро / вечер / раз в неделю / осознание, день появления,
// чередование медитаций и «каждую неделю новый вариант».
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

type Seed = {
  title: string;
  frequency: "daily" | "weekly" | "awareness";
  daypart: "morning" | "evening" | null;
  opensOnDay: number;
  newEachWeek?: boolean;
  alternation?: "first" | "second";
};

// Порядок и дни — из docs/data-model.md, раздел «3а. Программа».
const practices: Seed[] = [
  { title: "Улыбка", frequency: "daily", daypart: "morning", opensOnDay: 1 },
  { title: "Линия души", frequency: "daily", daypart: "morning", opensOnDay: 8 },
  { title: "Мини-зарядка", frequency: "daily", daypart: "morning", opensOnDay: 1 },
  { title: "Целительные звуки", frequency: "daily", daypart: "evening", opensOnDay: 4 },
  { title: "Мышление по навигатору дня", frequency: "daily", daypart: "evening", opensOnDay: 2 },
  {
    title: "Медитация на качество силы",
    frequency: "weekly",
    daypart: null,
    opensOnDay: 1,
    newEachWeek: true,
    alternation: "first",
  },
  { title: "Медитация на слабую стихию", frequency: "weekly", daypart: null, opensOnDay: 8, alternation: "second" },
  { title: "Прогулка без телефона", frequency: "weekly", daypart: null, opensOnDay: 15, newEachWeek: true },
  { title: "Полный цикл зарядки", frequency: "weekly", daypart: null, opensOnDay: 1 },
  { title: "Осознание по книге «2 жизни»", frequency: "awareness", daypart: null, opensOnDay: 1 },
  { title: "Осознание на слабую стихию", frequency: "awareness", daypart: null, opensOnDay: 8 },
];

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
try {
  let added = 0;
  for (const [index, item] of practices.entries()) {
    const result = await client.query(
      `insert into practice (title, frequency, daypart, position, opens_on_day, new_each_week, alternation)
       select $1, $2, $3, $4, $5, $6, $7 where not exists (select 1 from practice where title = $1)`,
      [
        item.title,
        item.frequency,
        item.daypart,
        index + 1,
        item.opensOnDay,
        item.newEachWeek ?? false,
        item.alternation ?? null,
      ],
    );
    added += result.rowCount ?? 0;
  }
  console.log(`Практик добавлено: ${added}, уже были: ${practices.length - added}.`);
} finally {
  await client.end();
}
