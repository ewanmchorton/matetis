// Общие помощники для обработчиков запросов в src/app/api.
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/shared/auth/session";
import { AppError } from "@/shared/lib/app-error";

type SignedInUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/**
 * Выполняет обработчик от имени вошедшего человека.
 * Не вошёл — 401. Нарушено правило приложения (AppError) — 400 с понятным текстом.
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
      return NextResponse.json({ code: error.code, message: error.message }, { status: 400 });
    }
    throw error;
  }
}

/** Тело запроса как объект или пустой объект, если пришло что-то другое. */
export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const body: unknown = await request.json().catch(() => null);
  return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
}
