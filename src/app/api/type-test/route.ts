// Сохранить прохождение теста: выбор в группе 1 и группе 2. В ответе — тип.
import { saveMyTypeTest } from "@/entities/type-test-attempt/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  return withUser((user) => saveMyTypeTest(user.id, { group1: body.group1, group2: body.group2 }));
}
