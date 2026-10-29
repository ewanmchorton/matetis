// Открыть или продлить доступ: { contact, months: 1 | 3 | 12 } или { contact, until }, по желанию amountCents.
// contact — почта или ник в Telegram.
import { extendAccess } from "@/entities/access/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";

export async function POST(request: Request) {
  const { contact, months, until, amountCents } = await readJsonObject(request);
  return withUser((user) => extendAccess(user.id, contact, { months, until, amountCents }));
}
