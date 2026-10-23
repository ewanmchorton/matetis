// Вход и регистрация (Better Auth). Используется только в серверном коде.
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";

import { personRoles } from "@/shared/auth/roles";
import { db } from "@/shared/db";
import * as schema from "@/shared/db/schema";

function isBlank(value: unknown): boolean {
  return typeof value !== "string" || value.trim() === "";
}

// При локальном запуске приложение открывают и с телефона в той же Wi-Fi-сети
// (адрес вида http://192.168.0.151:4317). Без этого вход с телефона отклоняется.
const localNetworkOrigins =
  process.env.NODE_ENV === "development"
    ? ["http://192.168.*.*:4317", "http://10.*.*.*:4317", "http://172.*.*.*:4317"]
    : [];

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  trustedOrigins: localNetworkOrigins,
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      // input: false — поле нельзя передать ни при регистрации, ни при изменении профиля.
      // Админа назначают только командой на сервере или запросом в базу.
      role: { type: [...personRoles], required: true, defaultValue: "user", input: false },
      // Ставится сервером в момент регистрации, см. databaseHooks ниже.
      // required: false — иначе Better Auth требует его ещё до хука. В базе поле обязательное.
      consentedAt: { type: "date", required: false, input: false },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        if (isBlank(ctx.body?.name)) {
          throw new APIError("BAD_REQUEST", { message: "Укажите имя" });
        }
        if (ctx.body?.consent !== true) {
          throw new APIError("BAD_REQUEST", {
            message: "Нужно согласие на обработку персональных данных",
          });
        }
      }
      if (ctx.path === "/update-user" && ctx.body && "name" in ctx.body && isBlank(ctx.body.name)) {
        throw new APIError("BAD_REQUEST", { message: "Имя не может быть пустым" });
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        // Роль и время согласия задаёт только сервер, что бы ни пришло в запросе.
        before: async (user) => ({
          data: { ...user, name: user.name.trim(), role: "user", consentedAt: new Date() },
        }),
      },
    },
  },
  plugins: [nextCookies()],
});
