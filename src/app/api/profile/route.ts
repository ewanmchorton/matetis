// Данные экрана «Профиль»: имя, почта или ник в Telegram, настройки, друзья и входящие запросы.
import { listFriends, listIncomingRequests } from "@/entities/friendship/server";
import { getMySettings } from "@/entities/person-settings/server";
import { withPaidUser } from "@/shared/api/route-helpers";
import { contactOf } from "@/shared/auth/contact";

export function GET() {
  return withPaidUser(async (user) => {
    const [settings, friends, incoming] = await Promise.all([
      getMySettings(user.id),
      listFriends(user.id),
      listIncomingRequests(user.id),
    ]);
    return { me: { name: user.name, contact: contactOf(user) }, settings, friends, incoming };
  });
}
