// Человек нажал «Просмотрено» у приветственного видео.
import { markWelcomeVideoSeen } from "@/entities/program/server";
import { withPaidUser } from "@/shared/api/route-helpers";

export async function POST() {
  return withPaidUser((user) => markWelcomeVideoSeen(user.id));
}
