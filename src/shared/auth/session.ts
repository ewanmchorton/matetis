// Проверка входа и роли на сервере. Используется в серверных компонентах,
// обработчиках запросов и серверных действиях.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { isStaticPrototype } from "@/shared/config/env";
import { routes } from "@/shared/config/routes";

export { isStaticPrototype };

export const getCurrentUser = cache(async () => {
  // Модуль входа подключается к базе, поэтому загружаем его только при запросе:
  // при сборке для Pages он не выполняется.
  const { auth } = await import("./server");
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
});

/** Администратор или null. Для обработчиков запросов: при null отвечать 403. */
export async function getAdminUser() {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

/** Для страниц админки: всех, кроме администраторов, отправляет на вход в админку. */
export async function requireAdminPage() {
  if (isStaticPrototype) return;
  if (!(await getAdminUser())) redirect(routes.adminLogin);
}
