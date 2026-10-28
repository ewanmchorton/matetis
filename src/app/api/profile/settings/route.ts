// Изменить свои настройки: публикация событий, автоподбор, фраза дня и часовой пояс телефона.
import { updateMySettings, type PersonSettingsChanges } from "@/entities/person-settings/server";
import { readJsonObject, withPaidUser } from "@/shared/api/route-helpers";

export async function PATCH(request: Request) {
  const body = await readJsonObject(request);
  const changes: PersonSettingsChanges = {};
  if (typeof body.publishEvents === "boolean") changes.publishEvents = body.publishEvents;
  if (typeof body.autoMatchConsent === "boolean") changes.autoMatchConsent = body.autoMatchConsent;
  if (typeof body.phraseNotifications === "boolean") changes.phraseNotifications = body.phraseNotifications;
  if (typeof body.phraseFromHour === "number") changes.phraseFromHour = body.phraseFromHour;
  if (typeof body.phraseToHour === "number") changes.phraseToHour = body.phraseToHour;
  if (typeof body.timeZone === "string") changes.timeZone = body.timeZone;
  return withPaidUser((user) => updateMySettings(user.id, changes));
}
