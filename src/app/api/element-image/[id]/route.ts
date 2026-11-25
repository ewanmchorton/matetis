// Файл картинки стихии. Видят вошедшие: это фон программы, не секрет.
import { readElementImage } from "@/entities/element/server";
import { getCurrentUser } from "@/shared/auth/session";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Нужно войти", { status: 401 });
  const { id } = await params;
  const file = await readElementImage(id);
  if (!file) return new Response("Нет такой картинки", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.type,
      "Content-Length": String(file.data.byteLength),
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
