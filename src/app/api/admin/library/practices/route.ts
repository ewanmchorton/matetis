// Редкие практики библиотеки. Приветственное видео сохраняется отдельно, слотом welcome.
import { deleteLibraryPractice, saveLibraryPractice } from "@/entities/library/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  return withUser((user) => saveLibraryPractice(user.id, body));
}

export async function DELETE(request: Request) {
  const { id } = await readJsonObject(request);
  return withUser((user) => deleteLibraryPractice(user.id, id));
}
