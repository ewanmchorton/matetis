// Проверка роли для серверных функций, которые принимают id того, кто делает запрос.
import { eq } from "drizzle-orm";

import { db, user } from "@/shared/db";
import { AppError } from "@/shared/lib/app-error";

import { isStaff } from "./roles";

export async function assertAdmin(viewerId: string) {
  const [viewer] = await db.select({ role: user.role }).from(user).where(eq(user.id, viewerId)).limit(1);
  if (viewer?.role !== "admin") throw new AppError("forbidden", "Доступно только администратору");
}

/** Админ или контент-менеджер: они наполняют материалы приложения. */
export async function assertStaff(viewerId: string) {
  const [viewer] = await db.select({ role: user.role }).from(user).where(eq(user.id, viewerId)).limit(1);
  if (!isStaff(viewer?.role)) throw new AppError("forbidden", "Доступно только сотрудникам");
}
