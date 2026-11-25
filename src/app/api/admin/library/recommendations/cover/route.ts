// Обложка книги или фильма на странице стихии: formData { id, file }.
import { saveRecommendationCover } from "@/entities/library/server";
import { withUser } from "@/shared/api/route-helpers";

export async function POST(request: Request) {
  const form = await request.formData();
  return withUser((user) => saveRecommendationCover(user.id, { id: form.get("id"), file: form.get("file") }));
}
