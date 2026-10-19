// Сохранить свою дату рождения: сервер считает квадрат Пифагора и сохраняет результат.
import { saveMyBirthDate } from "@/entities/birth-reading/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  return withUser((user) => saveMyBirthDate(user.id, body.birthDate));
}
