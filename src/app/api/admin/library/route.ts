// Видео библиотеки в админке: список и сохранение ({ slot, videoUrl, body }).
import { listProgramVideosForStaff, saveProgramVideo } from "@/entities/program/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";

export async function GET() {
  return withUser((user) => listProgramVideosForStaff(user.id));
}

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  return withUser((user) => saveProgramVideo(user.id, body));
}
