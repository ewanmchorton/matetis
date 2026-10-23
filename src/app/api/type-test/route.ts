// Тест на тип: текущий тип (GET) и сохранение нового прохождения (POST).
// Прошёл тест без доступа — заявка: администратор получает уведомление после ответа.
import { after } from "next/server";

import { notifyNewRequest } from "@/entities/access/server";
import { getMyCurrentType, saveMyTypeTest } from "@/entities/type-test-attempt/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";

export async function GET() {
  return withUser(async (user) => ({ type: await getMyCurrentType(user.id) }));
}

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  return withUser(async (user) => {
    const result = await saveMyTypeTest(user.id, { group1: body.group1, group2: body.group2 });
    after(() => notifyNewRequest(user).catch((error) => console.error("Уведомление о заявке не отправлено", error)));
    return result;
  });
}
