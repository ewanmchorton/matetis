// Автоматические тесты. Запуск: pnpm test
// Тесты работают с отдельной базой matetis_test, рабочая база не затрагивается.
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

import { testDatabaseUrl } from "./tests/test-database-url.mts";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    globalSetup: ["./tests/global-setup.ts"],
    env: { DATABASE_URL: testDatabaseUrl() },
    // Все тесты пользуются одной базой и очищают её перед каждым тестом,
    // поэтому файлы запускаются по очереди.
    fileParallelism: false,
    reporters: ["verbose"],
  },
});
