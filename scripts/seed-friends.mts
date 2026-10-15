// Создаёт двух тестовых людей, которые дружат, — чтобы посмотреть данные в pnpm db:studio.
// Запуск: pnpm db:seed-friends
// Повторный запуск ничего не дублирует. Только для локальной базы.
import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";
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

// Тестовый пароль обоих людей. Подходит для входа в локальное приложение.
const TEST_PASSWORD = "matetis-test-123";

const people = [
  { name: "Анна Тестовая", email: "anna.test@matetis.local" },
  { name: "Борис Тестовый", email: "boris.test@matetis.local" },
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
  // Так же, как при обычной регистрации Better Auth: пароль хранится только в виде хэша.
  await client.query(
    `insert into account (id, account_id, provider_id, user_id, password) values ($1, $2, 'credential', $2, $3)`,
    [randomUUID(), id, await hashPassword(TEST_PASSWORD)],
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
  await client.query("commit");
  console.log("Готово: Анна Тестовая и Борис Тестовый дружат.");
  console.log(`Почты: ${people[0].email}, ${people[1].email}. Пароль записан в scripts/seed-friends.mts.`);
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
