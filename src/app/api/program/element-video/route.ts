// Человек посмотрел видео по текущей стихии.
import { markElementVideoSeen } from "@/entities/program/server";
import { withPaidUser } from "@/shared/api/route-helpers";

export async function POST() {
  return withPaidUser((user) => markElementVideoSeen(user.id));
}
