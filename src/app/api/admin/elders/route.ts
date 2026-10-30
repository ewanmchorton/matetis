// Послания старцев в админке: список, добавить или изменить ({ id?, ... }), удалить ({ id }).
import { deleteElderMessage, listElderMessagesForStaff, saveElderMessage } from "@/entities/program/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";

export async function GET() {
  return withUser((user) => listElderMessagesForStaff(user.id));
}

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  return withUser((user) => saveElderMessage(user.id, body));
}

export async function DELETE(request: Request) {
  const { id } = await readJsonObject(request);
  return withUser((user) => deleteElderMessage(user.id, id));
}
