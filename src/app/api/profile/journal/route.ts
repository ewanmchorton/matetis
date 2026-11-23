// Журнал профиля: свои заметки к «Мышлению по навигатору», от новых к старым.
import { listMyJournal } from "@/entities/program/server";
import { withPaidUser } from "@/shared/api/route-helpers";

export function GET() {
  return withPaidUser(async (user) => ({ notes: await listMyJournal(user.id) }));
}
