// Книги и фильмы на странице стихии.
import { addRecommendation, deleteRecommendation } from "@/entities/library/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  return withUser((user) => addRecommendation(user.id, body));
}

export async function DELETE(request: Request) {
  const { id } = await readJsonObject(request);
  return withUser((user) => deleteRecommendation(user.id, id));
}
