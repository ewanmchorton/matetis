// Вход через бота в Telegram как часть Better Auth: адреса /api/auth/telegram/start и /api/auth/telegram/complete.
// Как устроен вход — в telegram-login.ts.
import { randomBytes } from "node:crypto";

import type { BetterAuthPlugin } from "better-auth";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";

import { db, user } from "@/shared/db";

import { createLoginRequest, findTelegramPerson, takeLoginRequest, TELEGRAM_LOGIN_MINUTES } from "./telegram-login";

/** Cookie с токеном входа: войти по подтверждённому запросу может только браузер, который его начал. */
const LOGIN_COOKIE = "matetis_telegram_login";

export function telegramLogin() {
  return {
    id: "telegram-login",
    endpoints: {
      /** Начать вход: ссылка на бота. */
      telegramStart: createAuthEndpoint("/telegram/start", { method: "POST" }, async (ctx) => {
        const botUsername = process.env.TELEGRAM_BOT_USERNAME;
        if (!botUsername) {
          throw new APIError("SERVICE_UNAVAILABLE", { message: "Вход через Telegram пока не настроен" });
        }
        const token = await createLoginRequest();
        ctx.setCookie(LOGIN_COOKIE, token, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: TELEGRAM_LOGIN_MINUTES * 60,
        });
        return ctx.json({ url: `https://t.me/${botUsername.replace(/^@/, "")}?start=${token}` });
      }),

      /**
       * Проверить, подтвердил ли человек вход в боте. Подтвердил — входит:
       * первый вход создаёт учётную запись без почты и без имени (имя спросит тест).
       */
      telegramComplete: createAuthEndpoint("/telegram/complete", { method: "POST" }, async (ctx) => {
        const token = ctx.getCookie(LOGIN_COOKIE);
        if (!token) return ctx.json({ status: "expired" as const });
        const state = await takeLoginRequest(token);
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
        ctx.setCookie(LOGIN_COOKIE, "", { path: "/", maxAge: 0 });
        return ctx.json({ status: "signed-in" as const, user: { name: signedIn.name } });
      }),
    },
  } satisfies BetterAuthPlugin;
}
