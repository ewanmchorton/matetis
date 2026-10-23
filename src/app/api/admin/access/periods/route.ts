// Открыть или продлить доступ: { email, months: 1 | 3 | 12 } или { email, until }, по желанию amountCents.
import { extendAccess } from "@/entities/access/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";

export async function POST(request: Request) {
  const { email, months, until, amountCents } = await readJsonObject(request);
  return withUser((user) => extendAccess(user.id, email, { months, until, amountCents }));
}
