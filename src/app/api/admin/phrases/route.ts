// Фразы дня в админке: список, добавить, удалить. Для админа и контент-менеджера.
import { addPhrase, deletePhrase, listPhrasesForStaff } from "@/entities/daily-phrase/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";

export async function GET() {
  return withUser((user) => listPhrasesForStaff(user.id));
}

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  return withUser((user) => addPhrase(user.id, body));
}

export async function DELETE(request: Request) {
  const { id } = await readJsonObject(request);
  return withUser((user) => deletePhrase(user.id, id));
}
