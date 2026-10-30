// Заметка для себя к практике на сегодня. GET — прочитать, PUT { text } — сохранить (пустая удаляется).
import { getMyNote, saveMyNote } from "@/entities/program/server";
import { readJsonObject, withPaidUser } from "@/shared/api/route-helpers";

export async function GET(_request: Request, { params }: RouteContext<"/api/program/notes/[practiceId]">) {
  const { practiceId } = await params;
  return withPaidUser((user) => getMyNote(user.id, practiceId));
}

export async function PUT(request: Request, { params }: RouteContext<"/api/program/notes/[practiceId]">) {
  const { practiceId } = await params;
  const { text } = await readJsonObject(request);
  return withPaidUser((user) => saveMyNote(user.id, practiceId, text));
}
