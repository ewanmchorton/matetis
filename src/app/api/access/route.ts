// Свой доступ: статус и телефон администратора для экранов без доступа.
import { getMyAccess } from "@/entities/access/server";
import { withUser } from "@/shared/api/route-helpers";

export async function GET() {
  return withUser((user) => getMyAccess(user));
}
