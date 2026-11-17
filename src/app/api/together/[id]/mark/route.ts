// Отметка на карточке совместной практики: { done: true | false }. Это та же отметка, что в программе.
import { markJointPractice } from "@/entities/together/server";
import { readJsonObject, withPaidUser } from "@/shared/api/route-helpers";

export async function POST(request: Request, { params }: RouteContext<"/api/together/[id]/mark">) {
  const { id } = await params;
  const { done } = await readJsonObject(request);
  return withPaidUser((user) => markJointPractice(user.id, id, done !== false));
}
