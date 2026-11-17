"use client";

import Link from "next/link";

import { CompanionAvatar } from "@/entities/companion";
import { routes } from "@/shared/config/routes";
import { typograph } from "@/shared/lib/typograph";
import { Button } from "@/shared/ui/button";
import { CardInset } from "@/shared/ui/glass-card";

import type { ProfileData, ProfileFriend } from "../model/types";

/** Под аватаром – только имя: фамилия не помещается. */
function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

function FriendAvatar({ person }: { person: ProfileFriend }) {
  return (
    <li className="w-16 shrink-0">
      <Link href={`${routes.person}/${person.id}`} className="flex flex-col items-center gap-1.5">
        <CompanionAvatar stage={person.companionStage} />
        <span className="w-full truncate text-center type-caption text-foreground" title={person.name}>
          {firstName(person.name)}
        </span>
      </Link>
    </li>
  );
}

/** Входящие запросы и список друзей внутри первой карточки профиля. */
export function ProfileFriends({
  friends,
  incoming,
  onAnswer,
}: {
  friends: ProfileFriend[];
  incoming: ProfileData["incoming"];
  onAnswer: (personId: string, action: "accept" | "decline") => void;
}) {
  return (
    <>
      {incoming.map((person) => (
        <CardInset key={person.id} className="space-y-3 border border-primary/10 bg-primary/8">
          <p className="type-secondary text-foreground">{typograph(`${person.name} хочет добавить вас в друзья`)}</p>
          <div className="flex gap-3">
            <Button size="cta-sm" onClick={() => onAnswer(person.id, "accept")}>
              Принять
            </Button>
            <Button size="cta-sm" variant="outline" onClick={() => onAnswer(person.id, "decline")}>
              Отклонить
            </Button>
          </div>
        </CardInset>
      ))}

      {friends.length > 0 ? (
        <ul aria-label="Друзья" className="-mx-1 flex justify-between gap-2 overflow-x-auto px-1">
          {friends.map((person) => (
            <FriendAvatar key={person.id} person={person} />
          ))}
        </ul>
      ) : (
        incoming.length === 0 && <p className="type-secondary text-muted-foreground">Друзей пока нет.</p>
      )}
    </>
  );
}
