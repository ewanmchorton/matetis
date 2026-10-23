// Изменить свои настройки публикации.
import { updateMySettings, type PersonSettings } from "@/entities/person-settings/server";
import { readJsonObject, withPaidUser } from "@/shared/api/route-helpers";

export async function PATCH(request: Request) {
  const body = await readJsonObject(request);
  const changes: Partial<PersonSettings> = {};
  if (typeof body.publishEvents === "boolean") changes.publishEvents = body.publishEvents;
  if (typeof body.autoMatchConsent === "boolean") changes.autoMatchConsent = body.autoMatchConsent;
  return withPaidUser((user) => updateMySettings(user.id, changes));
}
