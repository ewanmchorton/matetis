import { defineConfig } from "drizzle-kit";

// drizzle-kit не читает .env.local сам, поэтому загружаем его здесь.
try {
  process.loadEnvFile(".env.local");
} catch {
  // Файла нет — берём DATABASE_URL из окружения.
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/shared/db/schema",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
  strict: true,
  verbose: true,
});
