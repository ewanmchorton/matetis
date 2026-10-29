// Вход через бота в Telegram как часть Better Auth: адреса /api/auth/telegram/start и /api/auth/telegram/complete.
// Как устроен вход — в telegram-login.ts.
import { randomBytes } from "node:crypto";

import type { BetterAuthPlugin, StandardSchemaV1 } from "better-auth";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";

import { db, user } from "@/shared/db";

import { createLoginRequest, findTelegramPerson, takeLoginRequest } from "./telegram-login";

/** Строковое поле тела запроса длиной от min до 64 символов. */
const isText = (value: unknown, min: number): value is string =>
  typeof value === "string" && value.length >= min && value.length <= 64;

/**
 * secret — метка браузера, её придумывает экран входа и не показывает никому.
 * Войти по подтверждённой ссылке может только тот, кто знает и ссылку, и метку.
 */
const startBody: StandardSchemaV1<{ secret: string }> = {
  "~standard": {
    version: 1,
    vendor: "matetis",
    validate: (value) => {
      const { secret } = (value ?? {}) as { secret?: unknown };
      return isText(secret, 16) ? { value: { secret } } : { issues: [{ message: "Нет метки браузера" }] };
    },
  },
};

/** token — из ссылки на бота, которую нажал человек. */
const completeBody: StandardSchemaV1<{ secret: string; token: string }> = {
  "~standard": {
    version: 1,
    vendor: "matetis",
    validate: (value) => {
      const { secret, token } = (value ?? {}) as { secret?: unknown; token?: unknown };
      return isText(secret, 16) && isText(token, 1)
        ? { value: { secret, token } }
        : { issues: [{ message: "Нет ссылки для входа" }] };
    },
  },
};

export function telegramLogin() {
  return {
    id: "telegram-login",
    endpoints: {
      /** Ссылка на бота. Экран входа просит её заранее и обновляет, пока человек не нажал кнопку. */
      telegramStart: createAuthEndpoint("/telegram/start", { method: "POST", body: startBody }, async (ctx) => {
        const botUsername = process.env.TELEGRAM_BOT_USERNAME;
        if (!botUsername) {
          throw new APIError("SERVICE_UNAVAILABLE", { message: "Вход через Telegram пока не настроен" });
        }
        const token = await createLoginRequest(ctx.body.secret);
        return ctx.json({ token, url: `https://t.me/${botUsername.replace(/^@/, "")}?start=${token}` });
      }),

      /**
       * Проверить, подтвердил ли человек вход в боте. Подтвердил — входит:
       * первый вход создаёт учётную запись без почты и без имени (имя спросит тест).
       */
      telegramComplete: createAuthEndpoint("/telegram/complete", { method: "POST", body: completeBody }, async (ctx) => {
        const state = await takeLoginRequest(ctx.body.token, ctx.body.secret);
        if (state.status !== "confirmed") return ctx.json({ status: state.status });

        let userId = await findTelegramPerson(state);
        if (!userId) {
          userId = randomBytes(16).toString("hex");
          // Роль и время согласия задаёт сервер: согласие человек даёт кнопкой «Войти через Telegram».
          await db.insert(user).values({
            id: userId,
            name: "",
            role: "user",
            consentedAt: new Date(),
            telegramId: state.telegramId,
            telegramUsername: state.telegramUsername,
          });
        }
        const signedIn = await ctx.context.internalAdapter.findUserById(userId);
        if (!signedIn) throw new APIError("INTERNAL_SERVER_ERROR", { message: "Не удалось войти" });

        const session = await ctx.context.internalAdapter.createSession(signedIn.id);
        await setSessionCookie(ctx, { session, user: signedIn });
        return ctx.json({ status: "signed-in" as const, user: { name: signedIn.name } });
      }),
    },
  } satisfies BetterAuthPlugin;
}
