// Аудио редкой практики. Слышат вошедшие с доступом: библиотека платная.
import { hasAccess } from "@/entities/access/server";
import { readPracticeAudio } from "@/entities/library/server";
import { getCurrentUser } from "@/shared/auth/session";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Нужно войти", { status: 401 });
  if (!(await hasAccess(user))) return new Response("Нужен доступ к программе", { status: 403 });
  const { id } = await params;
  const file = await readPracticeAudio(id);
  if (!file) return new Response("Нет записи", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.type,
      "Content-Length": String(file.data.byteLength),
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
