// Назначает роль admin существующему человеку.
// Запуск: pnpm admin:promote <email>
// Работает только там, где есть доступ к базе (переменная DATABASE_URL).
import pg from "pg";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Файла нет — на сервере DATABASE_URL задаётся в окружении.
}

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Укажите почту: pnpm admin:promote <email>");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL не задан.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
try {
  const found = await client.query<{ role: string }>(
    'select role from "user" where email = $1',
    [email],
  );
  if (found.rowCount === 0) {
    console.error(`Человек с почтой ${email} не найден. Сначала он должен зарегистрироваться.`);
    process.exitCode = 1;
  } else if (found.rows[0].role === "admin") {
    console.log(`${email} уже администратор.`);
  } else {
    await client.query(
      `update "user" set role = 'admin', updated_at = now() where email = $1`,
      [email],
    );
    console.log(`${email} теперь администратор.`);
  }
} finally {
  await client.end();
}
