// Перед тестами: создать базу matetis_test, если её нет, и применить к ней все миграции.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

import { TEST_DATABASE_NAME, testDatabaseUrl, workDatabaseUrl } from "./test-database-url.mts";

export default async function setup() {
  const admin = new pg.Client({ connectionString: workDatabaseUrl() });
  await admin.connect();
  try {
    const found = await admin.query("select 1 from pg_database where datname = $1", [
      TEST_DATABASE_NAME,
    ]);
    if (found.rowCount === 0) await admin.query(`create database ${TEST_DATABASE_NAME}`);
  } finally {
    await admin.end();
  }

  const pool = new pg.Pool({ connectionString: testDatabaseUrl() });
  try {
    await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  } finally {
    await pool.end();
  }
}
