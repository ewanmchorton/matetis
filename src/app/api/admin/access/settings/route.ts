// Настройки доступа: телефон администратора и цены в евроцентах. Только администратор.
import { getAccessSettingsForAdmin, updateAccessSettings } from "@/entities/access/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";

export async function GET() {
  return withUser((user) => getAccessSettingsForAdmin(user.id));
}

export async function PATCH(request: Request) {
  const { adminPhone, firstMonthCents, monthCents, threeMonthsCents } = await readJsonObject(request);
  return withUser((user) => updateAccessSettings(user.id, { adminPhone, firstMonthCents, monthCents, threeMonthsCents }));
}
