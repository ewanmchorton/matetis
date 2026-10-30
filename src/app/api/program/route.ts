// Программа человека на сегодня: практики, отметки, навигатор, буквы недели.
// ?tz=Europe/Moscow — часовой пояс телефона: по нему считается «сегодня», сохраняется в настройках.
import { updateMySettings } from "@/entities/person-settings/server";
import { getMyProgram } from "@/entities/program/server";
import { withPaidUser } from "@/shared/api/route-helpers";

export async function GET(request: Request) {
  const timeZone = new URL(request.url).searchParams.get("tz");
  return withPaidUser(async (user) => {
    if (timeZone) await updateMySettings(user.id, { timeZone });
    return getMyProgram(user.id);
  });
}
