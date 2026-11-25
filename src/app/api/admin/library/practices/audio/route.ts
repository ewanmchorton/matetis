// Аудио редкой практики: formData { id, file }.
import { savePracticeAudio } from "@/entities/library/server";
import { withUser } from "@/shared/api/route-helpers";

export async function POST(request: Request) {
  const form = await request.formData();
  return withUser((user) => savePracticeAudio(user.id, { id: form.get("id"), file: form.get("file") }));
}
