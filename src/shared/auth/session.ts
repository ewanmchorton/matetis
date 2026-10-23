// Проверка входа и роли на сервере. Используется в серверных компонентах,
// обработчиках запросов и серверных действиях.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { isStaticPrototype } from "@/shared/config/env";
import { routes } from "@/shared/config/routes";

import { isStaff } from "./roles";

export { isStaticPrototype };

export const getCurrentUser = cache(async () => {
  // Модуль входа подключается к базе, поэтому загружаем его только при запросе:
  // при сборке для Pages он не выполняется.
  const { auth } = await import("./server");
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
});

/**
 * Для страниц админки: всех, кроме сотрудников, отправляет на вход в админку.
 * only: "admin" — раздел только для администратора (ученики, доступы):
 * контент-менеджера возвращает на главную админки.
 */
export async function requireAdminPage(only?: "admin") {
  if (isStaticPrototype) return;
  const user = await getCurrentUser();
  if (!isStaff(user?.role)) redirect(routes.adminLogin);
  if (only === "admin" && user?.role !== "admin") redirect(routes.admin);
}
