// Вход и выход из браузера. Запросы идут на /api/auth этого же сайта.
import type { BetterAuthClientPlugin } from "better-auth/client";
import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { telegramLogin } from "./telegram-plugin";

/** Вход через Telegram: authClient.telegram.start() и authClient.telegram.complete(). */
const telegramLoginClient = () =>
  ({
    id: "telegram-login",
    $InferServerPlugin: {} as ReturnType<typeof telegramLogin>,
    // После входа обновляем данные о вошедшем человеке.
    atomListeners: [{ matcher: (path) => path === "/telegram/complete", signal: "$sessionSignal" }],
  }) satisfies BetterAuthClientPlugin;

export const authClient = createAuthClient({ plugins: [emailOTPClient(), telegramLoginClient()] });
