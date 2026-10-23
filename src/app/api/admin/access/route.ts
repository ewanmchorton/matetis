// Раздел «Доступы»: все люди со статусами. ?q= — поиск по почте или имени. Только администратор.
import { listAccessForAdmin } from "@/entities/access/server";
import { withUser } from "@/shared/api/route-helpers";

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams.get("q") ?? "";
  return withUser((user) => listAccessForAdmin(user.id, search));
}
