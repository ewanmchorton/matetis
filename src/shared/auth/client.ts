// Вход и выход из браузера. Запросы идут на /api/auth этого же сайта.
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
