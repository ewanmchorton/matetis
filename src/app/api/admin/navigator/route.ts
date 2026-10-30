// Послания навигатора в админке (раздел «Навигатор»): список, добавить или заменить ({ id?, ... }), удалить ({ id }).
import { deleteNavigatorMessage, listNavigatorMessagesForStaff, saveNavigatorMessage } from "@/entities/program/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";

export async function GET() {
  return withUser((user) => listNavigatorMessagesForStaff(user.id));
}

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  return withUser((user) => saveNavigatorMessage(user.id, body));
}

export async function DELETE(request: Request) {
  const { id } = await readJsonObject(request);
  return withUser((user) => deleteNavigatorMessage(user.id, id));
}
