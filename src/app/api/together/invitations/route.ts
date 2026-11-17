// Пригласить друга: { friendId, practiceId }.
import { inviteFriend } from "@/entities/together/server";
import { readJsonObject, withPaidUser } from "@/shared/api/route-helpers";

export async function POST(request: Request) {
  const { friendId, practiceId } = await readJsonObject(request);
  return withPaidUser((user) => inviteFriend(user.id, friendId, practiceId));
}
