// Мой спутник: состояние и экран, который пора показать (GET). «Дальше» на экране спутника (POST).
import { getMyCompanion, markMyCompanionSeen } from "@/entities/program/server";
import { withPaidUser } from "@/shared/api/route-helpers";

export async function GET() {
  return withPaidUser((user) => getMyCompanion(user.id));
}

export async function POST() {
  return withPaidUser((user) => markMyCompanionSeen(user.id));
}
