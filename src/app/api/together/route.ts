// Вкладка «Вместе»: карточка совместной практики, лента друзей, подборка людей, если друзей нет.
import { getTogether } from "@/entities/together/server";
import { withPaidUser } from "@/shared/api/route-helpers";

export function GET() {
  return withPaidUser((user) => getTogether(user.id));
}
