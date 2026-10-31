// Тестовый администратор и данные для карточки ученика в админке.
// Создаёт администратора «Админ Тестовый», а Анне Тестовой (из pnpm db:seed-friends)
// добавляет пройденный тест (Радикал) и дату рождения 15.03.1988 — в карточке видны стихии и круг Усин.
// Запуск: pnpm db:seed-admin
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

const ADMIN = { name: "Админ Тестовый", email: "admin.test@matetis.local" };
/** Пароль тестового администратора — только для локальной базы. */
const ADMIN_PASSWORD = "matetis-local-admin";
const STUDENT = { name: "Анна Тестовая", email: "anna.test@matetis.local" };

// Квадрат Пифагора для 15.03.1988: сколько раз встречается каждая цифра 0–9.
// Совпадает с расчётом в src/entities/birth-reading/model/calculate.ts (проверено тестом).
const BIRTH_DATE = "1988-03-15";
const DIGIT_COUNTS = [1, 2, 0, 4, 0, 2, 1, 0, 3, 1];

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

async function ensurePerson(name: string, email: string, role: "user" | "admin"): Promise<string> {
  const found = await client.query<{ id: string }>('select id from "user" where email = $1', [email]);
  if (found.rowCount) {
    await client.query('update "user" set role = $2 where id = $1', [found.rows[0].id, role]);
    return found.rows[0].id;
  }

  const id = randomUUID();
  await client.query(
    `insert into "user" (id, name, email, email_verified, role, consented_at) values ($1, $2, $3, true, $4, now())`,
    [id, name, email, role],
  );
  return id;
}

try {
  await client.query("begin");
  const adminId = await ensurePerson(ADMIN.name, ADMIN.email, "admin");
  // Пароль для входа в админку: задаётся каждый раз заново.
  const hash = await hashPassword(ADMIN_PASSWORD);
  const updated = await client.query(
    `update account set password = $2, updated_at = now() where user_id = $1 and provider_id = 'credential'`,
    [adminId, hash],
  );
  if (updated.rowCount === 0) {
    await client.query(
      `insert into account (id, account_id, provider_id, user_id, password, created_at, updated_at)
       values ($1, $2, 'credential', $2, $3, now(), now())`,
      [randomUUID(), adminId, hash],
    );
  }
  const studentId = await ensurePerson(STUDENT.name, STUDENT.email, "user");

  // Тест добавляется, только если Анна его ещё не проходила.
  await client.query(
    `insert into type_test_attempt (user_id, group1_code, group2_code)
     select $1, 'А', '2' where not exists (select 1 from type_test_attempt where user_id = $1)`,
    [studentId],
  );
  // Дата рождения не перезаписывается, если Анна уже указала свою.
  await client.query(
    `insert into birth_reading (user_id, birth_date, digit_0, digit_1, digit_2, digit_3, digit_4, digit_5, digit_6, digit_7, digit_8, digit_9)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     on conflict (user_id) do nothing`,
    [studentId, BIRTH_DATE, ...DIGIT_COUNTS],
  );
  await client.query("commit");
  console.log(`Готово. Вход в админку: ${ADMIN.email}, пароль — ADMIN_PASSWORD в scripts/seed-admin.mts.`);
  console.log(`У ученицы ${STUDENT.name} есть тест и дата рождения — откройте её в разделе «Ученики».`);
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
