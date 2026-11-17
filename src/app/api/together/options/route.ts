// Панель «Предложить практику»: друзья и практики, общие с выбранным другом (?friendId=…).
import { getInviteOptions } from "@/entities/together/server";
import { withPaidUser } from "@/shared/api/route-helpers";

export function GET(request: Request) {
  const friendId = new URL(request.url).searchParams.get("friendId");
  return withPaidUser((user) => getInviteOptions(user.id, friendId));
}
