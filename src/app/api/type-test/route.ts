// Тест на тип: текущий тип (GET) и сохранение нового прохождения (POST).
import { getMyCurrentType, saveMyTypeTest } from "@/entities/type-test-attempt/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";

export async function GET() {
  return withUser(async (user) => ({ type: await getMyCurrentType(user.id) }));
}

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  return withUser((user) => saveMyTypeTest(user.id, { group1: body.group1, group2: body.group2 }));
}
