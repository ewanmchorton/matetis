// Текущая стихия для админки и день перехода осенью с Земли на Металл.
// GET — состояние, POST { startsOn: "2026-10-14" | null } — задать или убрать день.
import { getElementCalendarForStaff, setMetalStart } from "@/entities/element/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";

export async function GET() {
  return withUser((user) => getElementCalendarForStaff(user.id));
}

export async function POST(request: Request) {
  const { startsOn } = await readJsonObject(request);
  return withUser((user) => setMetalStart(user.id, startsOn ?? null));
}
