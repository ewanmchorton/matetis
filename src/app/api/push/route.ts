// Уведомления на этом устройстве для человека (фраза дня).
// GET — ключ для подписки браузера и согласие на фразу дня, POST — включить ({ endpoint, keys, timeZone }), DELETE — выключить ({ endpoint }).
import { getMySettings, updateMySettings } from "@/entities/person-settings/server";
import { readJsonObject, withPaidUser, withUser } from "@/shared/api/route-helpers";
import { getPushPublicKey } from "@/shared/push/send-push";
import { removePushSubscription, savePushSubscription } from "@/shared/push/subscriptions.server";

export async function GET() {
  return withUser(async (user) => ({
    publicKey: getPushPublicKey(),
    phraseNotifications: (await getMySettings(user.id)).phraseNotifications,
  }));
}

export async function POST(request: Request) {
  const { endpoint, keys, timeZone } = await readJsonObject(request);
  return withPaidUser(async (user) => {
    await savePushSubscription(user.id, { endpoint, keys });
    if (typeof timeZone === "string") await updateMySettings(user.id, { timeZone });
    return { ok: true };
  });
}

export async function DELETE(request: Request) {
  const { endpoint } = await readJsonObject(request);
  return withUser((user) => removePushSubscription(user.id, endpoint));
}
