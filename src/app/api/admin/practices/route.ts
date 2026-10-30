// Практики программы в админке: список, добавить или изменить ({ id? , ... }), удалить ({ id }).
import { deletePractice, listPracticesForStaff, savePractice } from "@/entities/program/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";

export async function GET() {
  return withUser((user) => listPracticesForStaff(user.id));
}

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  return withUser((user) => savePractice(user.id, body));
}

export async function DELETE(request: Request) {
  const { id } = await readJsonObject(request);
  return withUser((user) => deletePractice(user.id, id));
}
