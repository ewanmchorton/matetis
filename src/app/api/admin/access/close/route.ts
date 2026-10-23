// Закрыть доступ сейчас: { email }. История оплат остаётся.
import { closeAccess } from "@/entities/access/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";

export async function POST(request: Request) {
  const { email } = await readJsonObject(request);
  return withUser((user) => closeAccess(user.id, email));
}
