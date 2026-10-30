// Отметить практику выполненной сегодня ({ done: true }) или снять отметку ({ done: false }).
import { setPracticeDone } from "@/entities/program/server";
import { readJsonObject, withPaidUser } from "@/shared/api/route-helpers";

export async function POST(request: Request, { params }: RouteContext<"/api/program/practices/[id]">) {
  const { id } = await params;
  const { done } = await readJsonObject(request);
  return withPaidUser((user) => setPracticeDone(user.id, id, done !== false));
}
