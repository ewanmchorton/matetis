// Ответ на приглашение или предложение месяца: { accept: true | false }.
import { answerJoint } from "@/entities/together/server";
import { readJsonObject, withPaidUser } from "@/shared/api/route-helpers";

export async function POST(request: Request, { params }: RouteContext<"/api/together/[id]/answer">) {
  const { id } = await params;
  const { accept } = await readJsonObject(request);
  return withPaidUser((user) => answerJoint(user.id, id, accept === true));
}
