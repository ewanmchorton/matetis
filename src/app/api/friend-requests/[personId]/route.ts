// Ответить на запрос в друзья, который прислал personId: { action: "accept" | "decline" }.
import { NextResponse } from "next/server";

import { acceptFriendRequest, declineFriendRequest } from "@/entities/friendship/server";
import { readJsonObject, withPaidUser } from "@/shared/api/route-helpers";

export async function POST(request: Request, ctx: RouteContext<"/api/friend-requests/[personId]">) {
  const { personId } = await ctx.params;
  const { action } = await readJsonObject(request);
  if (action !== "accept" && action !== "decline") {
    return NextResponse.json({ code: "bad_action", message: "Неизвестное действие" }, { status: 400 });
  }
  return withPaidUser(async (user) => {
    if (action === "accept") await acceptFriendRequest(user.id, personId);
    else await declineFriendRequest(user.id, personId);
    return { ok: true };
  });
}
