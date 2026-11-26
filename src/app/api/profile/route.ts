// Данные экрана «Профиль»: имя, почта или ник в Telegram, тип, дата рождения, спутник, настройки, друзья и входящие запросы.
import { getMyBirthReading } from "@/entities/birth-reading/server";
import { listFriends, listIncomingRequests } from "@/entities/friendship/server";
import { getMySettings } from "@/entities/person-settings/server";
import { getCompanionStages } from "@/entities/program/server";
import { getMyCurrentType } from "@/entities/type-test-attempt/server";
import { withPaidUser } from "@/shared/api/route-helpers";
import { contactOf } from "@/shared/auth/contact";

export function GET() {
  return withPaidUser(async (user) => {
    const [settings, friends, incoming, type, reading] = await Promise.all([
      getMySettings(user.id),
      listFriends(user.id),
      listIncomingRequests(user.id),
      getMyCurrentType(user.id),
      getMyBirthReading(user.id),
    ]);
    const stages = await getCompanionStages([user.id, ...friends.map((friend) => friend.id)]);
    return {
      me: {
        name: user.name,
        contact: contactOf(user),
        companionStage: stages.get(user.id) ?? 1,
        typeId: type?.id ?? null,
        birthDate: reading?.birthDate ?? null,
      },
      settings,
      friends: friends.map(({ id, name }) => ({ id, name, companionStage: stages.get(id) ?? 1 })),
      incoming: incoming.map(({ id, name }) => ({ id, name })),
    };
  });
}
