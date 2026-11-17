// Профиль другого человека: имя, его спутник и отношение ко мне (GET).
// Действия с дружбой (POST): { action: "send" | "cancel" | "accept" | "decline" | "remove" }.
import { NextResponse } from "next/server";

import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  getPublicProfile,
  removeFriend,
  sendFriendRequest,
} from "@/entities/friendship/server";
import { getCompanionStage } from "@/entities/program/server";
import { readJsonObject, withPaidUser } from "@/shared/api/route-helpers";
import { AppError } from "@/shared/lib/app-error";

async function profileFor(viewerId: string, personId: string) {
  const profile = await getPublicProfile(viewerId, personId);
  if (!profile) throw new AppError("person_not_found", "Такого профиля нет");
  return {
    person: { id: profile.person.id, name: profile.person.name },
    friendship: profile.friendship,
    companionStage: await getCompanionStage(personId),
  };
}

const actions = {
  send: sendFriendRequest,
  cancel: cancelFriendRequest,
  accept: acceptFriendRequest,
  decline: declineFriendRequest,
  remove: removeFriend,
};

export async function GET(_request: Request, ctx: RouteContext<"/api/people/[id]">) {
  const { id } = await ctx.params;
  return withPaidUser((user) => profileFor(user.id, id));
}

export async function POST(request: Request, ctx: RouteContext<"/api/people/[id]">) {
  const { id } = await ctx.params;
  const { action } = await readJsonObject(request);
  if (typeof action !== "string" || !(action in actions)) {
    return NextResponse.json({ code: "bad_action", message: "Неизвестное действие" }, { status: 400 });
  }
  return withPaidUser(async (user) => {
    await actions[action as keyof typeof actions](user.id, id);
    return profileFor(user.id, id);
  });
}
