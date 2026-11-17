// «Поддержать» событие друга: { on: true | false }.
import { supportEvent } from "@/entities/together/server";
import { readJsonObject, withPaidUser } from "@/shared/api/route-helpers";

export async function POST(request: Request, { params }: RouteContext<"/api/together/events/[id]/support">) {
  const { id } = await params;
  const { on } = await readJsonObject(request);
  return withPaidUser((user) => supportEvent(user.id, id, on !== false));
}
