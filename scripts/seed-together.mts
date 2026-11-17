// Тестовые данные для вкладки «Вместе». Входить можно двумя людьми:
//   Вера – ей пришло приглашение от Анны на «Внутреннюю улыбку»;
//   Глеб – идёт совместная «Мини-зарядка» с Борисом, Борис уже отметил, Глеб ещё нет.
// У обоих есть друзья с событиями в ленте: первая практика, возвращение, завершили практику вместе.
// Всем открыт доступ на месяц, программа начата 20 дней назад.
// Нужны практики программы: сначала pnpm db:seed-program.
// Запуск: pnpm db:seed-together
// Если в базе есть Ваня с Telegram @ivanmahortov, он тоже становится другом этих людей
// и получает приглашение от Ольги. Повторный запуск пересоздаёт совместные практики и события
// только этих тестовых людей. Только для локальной базы.
// Вход – по коду, письмо приходит в Mailpit: http://localhost:8025.
import { randomUUID } from "node:crypto";

import pg from "pg";

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
if (process.env.NODE_ENV === "production") {
  console.error("Тестовых людей нельзя создавать в рабочей базе.");
  process.exit(1);
}

const people = {
  vera: { name: "Вера", email: "vera.together@matetis.local" },
  gleb: { name: "Глеб", email: "gleb.together@matetis.local" },
  anna: { name: "Анна", email: "anna.together@matetis.local" },
  boris: { name: "Борис", email: "boris.together@matetis.local" },
  olga: { name: "Ольга", email: "olga.together@matetis.local" },
  dina: { name: "Дина", email: "dina.together@matetis.local" },
};
type Key = keyof typeof people;

const friendships: [Key, Key][] = [
  ["vera", "anna"],
  ["vera", "olga"],
  ["vera", "gleb"],
  ["vera", "dina"],
  ["gleb", "boris"],
  ["gleb", "dina"],
  ["gleb", "olga"],
  ["boris", "dina"],
];

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

/** Сегодня по времени приложения (Минск, как у людей без своего часового пояса) со сдвигом в днях. */
const DAY = `(now() at time zone 'Europe/Minsk')::date`;
const day = (shift: number) => `(${DAY} + ${shift})`;

async function ensurePerson(name: string, email: string): Promise<string> {
  const found = await client.query<{ id: string }>('select id from "user" where email = $1', [email]);
  if (found.rowCount) return found.rows[0].id;
  const id = randomUUID();
  await client.query(
    `insert into "user" (id, name, email, email_verified, consented_at) values ($1, $2, $3, true, now())`,
    [id, name, email],
  );
  return id;
}

async function practiceId(title: string): Promise<string> {
  const found = await client.query<{ id: string }>("select id from practice where title = $1", [title]);
  if (!found.rowCount) throw new Error(`Нет практики «${title}». Сначала запустите pnpm db:seed-program.`);
  return found.rows[0].id;
}

async function markPractice(userId: string, practice: string, shift: number) {
  await client.query(
    `insert into practice_mark (user_id, practice_id, day) values ($1, $2, ${day(shift)}) on conflict do nothing`,
    [userId, practice],
  );
}

async function feedEvent(userId: string, kind: string, hoursAgo: number, jointId: string | null = null) {
  const { rows } = await client.query<{ id: string }>(
    `insert into feed_event (user_id, kind, joint_id, created_at)
     values ($1, $2, $3, now() - make_interval(hours => $4)) returning id`,
    [userId, kind, jointId, hoursAgo],
  );
  return rows[0].id;
}

try {
  await client.query("begin");
  const smile = await practiceId("Внутренняя улыбка");
  const exercise = await practiceId("Мини-зарядка");

  const id = {} as Record<Key, string>;
  for (const key of Object.keys(people) as Key[]) {
    id[key] = await ensurePerson(people[key].name, people[key].email);
  }
  const ids = Object.values(id);

  // Чистый лист: прошлые совместные практики, события и отметки тестовых людей.
  await client.query(
    `delete from joint_practice where id in (select joint_id from joint_practice_member where user_id = any($1))`,
    [ids],
  );
  await client.query("delete from monthly_match where user_id = any($1)", [ids]);
  await client.query("delete from feed_event where user_id = any($1)", [ids]);
  await client.query("delete from practice_mark where user_id = any($1)", [ids]);

  for (const key of Object.keys(people) as Key[]) {
    await client.query(
      `insert into access_period (contact, starts_at, ends_at, amount_cents)
       select $1::text, now(), now() + interval '1 month', 0
       where not exists (select 1 from access_period where contact = $1::text and ends_at > now())`,
      [people[key].email],
    );
    await client.query(
      `insert into program_start (user_id, started_on) values ($1, ${day(-20)})
       on conflict (user_id) do update set started_on = excluded.started_on`,
      [id[key]],
    );
  }

  for (const [a, b] of friendships) {
    await client.query(
      `insert into friend_request (from_user_id, to_user_id, status, responded_at)
       values ($1, $2, 'accepted', now())
       on conflict (least(from_user_id, to_user_id), greatest(from_user_id, to_user_id))
       do update set status = 'accepted', responded_at = now()`,
      [id[a], id[b]],
    );
  }

  // Вера: приглашение от Анны, пришло час назад.
  const invite = await client.query<{ id: string }>(
    `insert into joint_practice (practice_id, source, invited_by, created_at)
     values ($1, 'invite', $2, now() - interval '1 hour') returning id`,
    [smile, id.anna],
  );
  await client.query(
    `insert into joint_practice_member (joint_id, user_id, accepted_at) values ($1, $2, now() - interval '1 hour'), ($1, $3, null)`,
    [invite.rows[0].id, id.anna, id.vera],
  );

  // Глеб и Борис: «Мини-зарядка» идёт третий день, Борис сделал вчера.
  const active = await client.query<{ id: string }>(
    `insert into joint_practice (practice_id, source, invited_by, status, created_at, starts_on, ends_on)
     values ($1, 'invite', $2, 'active', now() - interval '3 days', ${day(-2)}, ${day(4)}) returning id`,
    [exercise, id.boris],
  );
  await client.query(
    `insert into joint_practice_member (joint_id, user_id, accepted_at)
     values ($1, $2, now() - interval '3 days'), ($1, $3, now() - interval '2 days')`,
    [active.rows[0].id, id.boris, id.gleb],
  );
  await markPractice(id.boris, exercise, -1);

  // Борис и Дина уже завершили «Внутреннюю улыбку» вместе.
  const done = await client.query<{ id: string }>(
    `insert into joint_practice (practice_id, source, invited_by, status, created_at, starts_on, ends_on, closed_at)
     values ($1, 'invite', $2, 'completed', now() - interval '9 days', ${day(-8)}, ${day(-2)}, now() - interval '2 days')
     returning id`,
    [smile, id.dina],
  );
  await client.query(
    `insert into joint_practice_member (joint_id, user_id, accepted_at, open, dismissed_at)
     values ($1, $2, now() - interval '9 days', false, now()), ($1, $3, now() - interval '8 days', false, now())`,
    [done.rows[0].id, id.dina, id.boris],
  );
  await markPractice(id.dina, smile, -7);
  await markPractice(id.boris, smile, -3);

  // События в ленте.
  await markPractice(id.anna, smile, -1);
  await feedEvent(id.anna, "first_practice", 20);
  await markPractice(id.olga, smile, -15);
  await markPractice(id.olga, smile, 0);
  await feedEvent(id.olga, "first_practice", 15 * 24);
  await feedEvent(id.olga, "comeback", 3);
  await markPractice(id.dina, exercise, -10);
  await feedEvent(id.dina, "first_practice", 10 * 24);
  await feedEvent(id.boris, "first_practice", 12 * 24);
  const together = await feedEvent(id.dina, "joint_completed", 48, done.rows[0].id);
  await feedEvent(id.boris, "joint_completed", 48, done.rows[0].id);
  // Вера уже поддержала Дину.
  await client.query("insert into feed_reaction (event_id, user_id) values ($1, $2)", [together, id.vera]);

  // Аккаунт Вани (вход через Telegram @ivanmahortov): те же друзья и события,
  // плюс приглашение от Ольги, чтобы вкладка «Вместе» была заполнена.
  const vanya = await client.query<{ id: string }>(
    `select id from "user" where telegram_username = 'ivanmahortov'`,
  );
  if (vanya.rowCount) {
    const vanyaId = vanya.rows[0].id;
    for (const key of ["anna", "boris", "olga", "dina"] as const) {
      await client.query(
        `insert into friend_request (from_user_id, to_user_id, status, responded_at)
         values ($1, $2, 'accepted', now())
         on conflict (least(from_user_id, to_user_id), greatest(from_user_id, to_user_id))
         do update set status = 'accepted', responded_at = now()`,
        [vanyaId, id[key]],
      );
    }
    const forVanya = await client.query<{ id: string }>(
      `insert into joint_practice (practice_id, source, invited_by, created_at)
       values ($1, 'invite', $2, now() - interval '1 hour') returning id`,
      [smile, id.olga],
    );
    await client.query(
      `insert into joint_practice_member (joint_id, user_id, accepted_at)
       values ($1, $2, now() - interval '1 hour'), ($1, $3, null)`,
      [forVanya.rows[0].id, id.olga, vanyaId],
    );
  }

  await client.query("commit");
  console.log("Готово.");
  console.log(`Вера (${people.vera.email}) – приглашение от Анны на «Внутреннюю улыбку».`);
  console.log(`Глеб (${people.gleb.email}) – совместная «Мини-зарядка» с Борисом, Борис уже отметил.`);
  if (vanya.rowCount) console.log("Ваня (@ivanmahortov) – друзья с событиями и приглашение от Ольги.");
  console.log("Вход по коду, письма – в http://localhost:8025.");
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
