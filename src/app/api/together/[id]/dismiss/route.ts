// Закрыть карточку «Завершили».
import { dismissCompleted } from "@/entities/together/server";
import { withPaidUser } from "@/shared/api/route-helpers";

export async function POST(_request: Request, { params }: RouteContext<"/api/together/[id]/dismiss">) {
  const { id } = await params;
  return withPaidUser((user) => dismissCompleted(user.id, id));
}
