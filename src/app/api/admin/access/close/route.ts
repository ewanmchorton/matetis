// Закрыть доступ сейчас: { contact }. История оплат остаётся.
import { closeAccess } from "@/entities/access/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";

export async function POST(request: Request) {
  const { contact } = await readJsonObject(request);
  return withUser((user) => closeAccess(user.id, contact));
}
