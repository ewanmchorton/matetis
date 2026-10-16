"use client";

import { Button } from "@/shared/ui/button";
import { CardInset } from "@/shared/ui/glass-card";

import type { PublicPerson } from "../model/types";

function initial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

/** Под аватаром — только имя: фамилия не помещается. */
function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

function FriendAvatar({ person }: { person: PublicPerson }) {
  return (
    <li className="flex w-16 shrink-0 flex-col items-center gap-1.5">
      {person.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element -- адрес аватара приходит с сервера, размер известен
        <img src={person.avatar} alt="" className="size-14 rounded-full object-cover" />
      ) : (
        <span
          aria-hidden
          className="grid size-14 place-items-center rounded-full bg-secondary/80 type-block text-foreground"
        >
          {initial(person.name)}
        </span>
      )}
      <span className="w-full truncate text-center type-caption text-foreground" title={person.name}>
        {firstName(person.name)}
      </span>
    </li>
  );
}

/** Входящие запросы и список друзей внутри первой карточки профиля. */
export function ProfileFriends({
  friends,
  incoming,
  onAnswer,
}: {
  friends: PublicPerson[];
  incoming: PublicPerson[];
  onAnswer: (personId: string, action: "accept" | "decline") => void;
}) {
  return (
    <>
      {incoming.map((person) => (
        <CardInset key={person.id} className="space-y-3 border border-primary/10 bg-primary/8">
          <p className="type-secondary text-foreground">{person.name} хочет добавить вас в друзья</p>
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
