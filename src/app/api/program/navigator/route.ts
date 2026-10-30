// Навигатор дня: GET — текст и задание на сегодня, POST — «Прочитано».
import { getMyNavigator, markNavigatorRead } from "@/entities/program/server";
import { withPaidUser } from "@/shared/api/route-helpers";

export async function GET() {
  return withPaidUser((user) => getMyNavigator(user.id));
}

export async function POST() {
  return withPaidUser((user) => markNavigatorRead(user.id));
}
