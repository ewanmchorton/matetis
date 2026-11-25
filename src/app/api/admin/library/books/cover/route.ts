// Обложка книги в разделе «Книги»: formData { id, file }.
import { saveBookCover } from "@/entities/library/server";
import { withUser } from "@/shared/api/route-helpers";

export async function POST(request: Request) {
  const form = await request.formData();
  return withUser((user) => saveBookCover(user.id, { id: form.get("id"), file: form.get("file") }));
}
