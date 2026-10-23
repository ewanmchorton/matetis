// Общие помощники для обработчиков запросов в src/app/api.
import { NextResponse } from "next/server";

import { hasAccess } from "@/entities/access/server";
import { getCurrentUser } from "@/shared/auth/session";
import { AppError } from "@/shared/lib/app-error";

type SignedInUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Коды ошибок, на которые отвечаем 403. */
const forbiddenCodes = new Set(["forbidden", "no_access"]);

/**
 * Выполняет обработчик от имени вошедшего человека.
 * Не вошёл — 401. Нет прав (AppError «forbidden») — 403.
 * Нарушено правило приложения (AppError) — 400 с понятным текстом.
 */
export async function withUser(handler: (user: SignedInUser) => Promise<unknown>) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ code: "unauthorized", message: "Нужно войти" }, { status: 401 });
  }
  try {
    return NextResponse.json(await handler(user));
  } catch (error) {
    if (error instanceof AppError) {
      const status = forbiddenCodes.has(error.code) ? 403 : 400;
      return NextResponse.json({ code: error.code, message: error.message }, { status });
    }
    throw error;
  }
}

/**
 * То же, что withUser, но для платной части приложения: без доступа по подписке — 403 «no_access».
 * Бесплатны вход, тест, дата рождения и смена имени — там используется withUser.
 */
export async function withPaidUser(handler: (user: SignedInUser) => Promise<unknown>) {
  return withUser(async (user) => {
    if (!(await hasAccess(user))) throw new AppError("no_access", "Нужен доступ к программе");
    return handler(user);
  });
}

/** Тело запроса как объект или пустой объект, если пришло что-то другое. */
export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const body: unknown = await request.json().catch(() => null);
  return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
}

