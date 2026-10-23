// Уведомления администратору на это устройство.
// GET — ключ для подписки браузера, POST — включить ({ endpoint, keys }), DELETE — выключить ({ endpoint }).
import { removeMyPushSubscription, saveMyPushSubscription } from "@/entities/access/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";
import { assertAdmin } from "@/shared/auth/assert-admin";
import { getPushPublicKey } from "@/shared/push/send-push";

export async function GET() {
  return withUser(async (user) => {
    await assertAdmin(user.id);
    return { publicKey: getPushPublicKey() };
  });
}

export async function POST(request: Request) {
  const { endpoint, keys } = await readJsonObject(request);
  return withUser((user) => saveMyPushSubscription(user.id, { endpoint, keys }));
}

export async function DELETE(request: Request) {
  const { endpoint } = await readJsonObject(request);
  return withUser((user) => removeMyPushSubscription(user.id, endpoint));
}
