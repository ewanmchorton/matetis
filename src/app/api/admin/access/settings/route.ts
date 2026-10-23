// Настройки доступа: телефон и ник Telegram администратора, цены в евроцентах. Только администратор.
import { getAccessSettingsForAdmin, updateAccessSettings } from "@/entities/access/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";

export async function GET() {
  return withUser((user) => getAccessSettingsForAdmin(user.id));
}

export async function PATCH(request: Request) {
  const { adminPhone, adminTelegram, firstMonthCents, monthCents, threeMonthsCents } = await readJsonObject(request);
  return withUser((user) =>
    updateAccessSettings(user.id, { adminPhone, adminTelegram, firstMonthCents, monthCents, threeMonthsCents }),
  );
}
