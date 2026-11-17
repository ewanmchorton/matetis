// Прекратить совместную практику. Личные отметки остаются.
import { stopJoint } from "@/entities/together/server";
import { withPaidUser } from "@/shared/api/route-helpers";

export async function POST(_request: Request, { params }: RouteContext<"/api/together/[id]/stop">) {
  const { id } = await params;
  return withPaidUser((user) => stopJoint(user.id, id));
}
