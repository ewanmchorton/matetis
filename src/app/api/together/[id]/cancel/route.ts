// Отменить своё приглашение, пока друг не ответил.
import { cancelInvite } from "@/entities/together/server";
import { withPaidUser } from "@/shared/api/route-helpers";

export async function POST(_request: Request, { params }: RouteContext<"/api/together/[id]/cancel">) {
  const { id } = await params;
  return withPaidUser((user) => cancelInvite(user.id, id));
}
