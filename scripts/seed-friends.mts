// Создаёт тестовых людей: Анна и Борис дружат, Ольга прислала Анне запрос в друзья.
// Чтобы посмотреть данные в pnpm db:studio или войти Анной и открыть профиль.
// Всем троим открыт доступ на месяц от запуска. Вход — по коду, письмо приходит в Mailpit: http://localhost:8025.
// Запуск: pnpm db:seed-friends
// Повторный запуск ничего не дублирует. Только для локальной базы.
import { randomUUID } from "node:crypto";

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
if (process.env.NODE_ENV === "production") {
  console.error("Тестовых людей нельзя создавать в рабочей базе.");
  process.exit(1);
}

const people = [
  { name: "Анна Тестовая", email: "anna.test@matetis.local" },
  { name: "Борис Тестовый", email: "boris.test@matetis.local" },
  { name: "Ольга Тестовая", email: "olga.test@matetis.local" },
];

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

async function ensurePerson(name: string, email: string): Promise<string> {
  const found = await client.query<{ id: string }>('select id from "user" where email = $1', [
    email,
  ]);
  if (found.rowCount) return found.rows[0].id;

  const id = randomUUID();
  await client.query(
    `insert into "user" (id, name, email, email_verified, consented_at) values ($1, $2, $3, true, now())`,
    [id, name, email],
  );
  return id;
}

try {
  await client.query("begin");
  const [annaId, borisId] = [
    await ensurePerson(people[0].name, people[0].email),
    await ensurePerson(people[1].name, people[1].email),
  ];
  await client.query(
    `insert into friend_request (from_user_id, to_user_id, status, responded_at)
     values ($1, $2, 'accepted', now())
     on conflict (least(from_user_id, to_user_id), greatest(from_user_id, to_user_id))
     do update set status = 'accepted', responded_at = now()`,
    [annaId, borisId],
  );
  const olgaId = await ensurePerson(people[2].name, people[2].email);
  // Запрос Ольги не перезаписывается, если Анна уже ответила на него в приложении.
  await client.query(
    `insert into friend_request (from_user_id, to_user_id) values ($1, $2)
     on conflict (least(from_user_id, to_user_id), greatest(from_user_id, to_user_id)) do nothing`,
    [olgaId, annaId],
  );
  // Доступ на месяц, чтобы открывались профиль и друзья. Повторный запуск не продлевает уже идущий.
  for (const person of people) {
    await client.query(
      `insert into access_period (email, starts_at, ends_at, amount_cents)
       select $1::text, now(), now() + interval '1 month', 0
       where not exists (select 1 from access_period where email = $1::text and ends_at > now())`,
      [person.email],
    );
  }
  await client.query("commit");
  console.log("Готово: Анна Тестовая и Борис Тестовый дружат, Ольга Тестовая прислала Анне запрос.");
  console.log(`Почты: ${people.map((p) => p.email).join(", ")}. Вход по коду, письма — в http://localhost:8025.`);
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
