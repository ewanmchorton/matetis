// Новый пароль сотруднику ({ email, password }). Только для администратора.
import { resetStaffPassword } from "@/entities/staff/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  return withUser((user) => resetStaffPassword(user.id, body));
}
