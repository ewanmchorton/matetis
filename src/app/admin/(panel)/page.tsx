import { redirect } from "next/navigation";

import { routes } from "@/shared/config/routes";

/** Прежний «Обзор» убран. Вход в админку открывает стихии: там текущая стихия и картинки. */
export default function AdminHomePage() {
  redirect(routes.adminElements);
}
