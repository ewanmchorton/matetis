// Задаёт пароль для входа в админку. Нужен, чтобы первый администратор мог войти;
// дальше пароли сотрудникам задаёт администратор в разделе «Сотрудники».
// Запуск: pnpm admin:set-password <email> — пароль спросит в терминале, на экране он не виден.
// Работает только там, где есть доступ к базе (переменная DATABASE_URL).
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline";

import { hashPassword } from "better-auth/crypto";
import pg from "pg";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Файла нет — на сервере DATABASE_URL задаётся в окружении.
}

const MIN_LENGTH = 8;
const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Укажите почту: pnpm admin:set-password <email>");
  process.exit(1);
}
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL не задан.");
  process.exit(1);
}

/** Спросить пароль, не показывая набранное. */
function askHidden(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const write = (rl as unknown as { _writeToOutput: (text: string) => void })._writeToOutput.bind(rl);
  let muted = false;
  (rl as unknown as { _writeToOutput: (text: string) => void })._writeToOutput = (text) => {
    if (!muted) write(text);
  };
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
try {
  const found = await client.query<{ id: string; role: string }>('select id, role from "user" where email = $1', [email]);
  if (found.rowCount === 0) {
    console.error(`Человек с почтой ${email} не найден. Сначала он должен зарегистрироваться.`);
    process.exitCode = 1;
  } else if (found.rows[0].role === "user") {
    console.error(`${email} не сотрудник. Сначала назначьте роль: pnpm admin:promote ${email}`);
    process.exitCode = 1;
  } else {
    const password = await askHidden("Новый пароль: ");
    const repeat = await askHidden("Ещё раз: ");
    if (password.length < MIN_LENGTH) {
      console.error(`Пароль — не короче ${MIN_LENGTH} знаков.`);
      process.exitCode = 1;
    } else if (password !== repeat) {
      console.error("Пароли не совпадают.");
      process.exitCode = 1;
    } else {
      const userId = found.rows[0].id;
      const hash = await hashPassword(password);
      const updated = await client.query(
        `update account set password = $2, updated_at = now() where user_id = $1 and provider_id = 'credential'`,
        [userId, hash],
      );
      if (updated.rowCount === 0) {
        await client.query(
          `insert into account (id, account_id, provider_id, user_id, password, created_at, updated_at)
           values ($1, $2, 'credential', $2, $3, now(), now())`,
          [randomUUID(), userId, hash],
        );
      }
      console.log(`Пароль для ${email} сохранён. Вход в админку: /admin/login`);
    }
  }
} finally {
  await client.end();
}
