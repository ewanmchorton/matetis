// Отметить практику выполненной сегодня ({ done: true }) или снять отметку ({ done: false }).
// После отметки – события ленты и завершение совместной практики, если практика совместная.
import { setPracticeDone } from "@/entities/program/server";
import { afterPracticeMarked } from "@/entities/together/server";
import { readJsonObject, withPaidUser } from "@/shared/api/route-helpers";

export async function POST(request: Request, { params }: RouteContext<"/api/program/practices/[id]">) {
  const { id } = await params;
  const { done } = await readJsonObject(request);
  return withPaidUser(async (user) => {
    const result = await setPracticeDone(user.id, id, done !== false);
    if (done !== false) await afterPracticeMarked(user.id);
    return result;
  });
}
