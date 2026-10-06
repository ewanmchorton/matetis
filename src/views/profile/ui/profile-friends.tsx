"use client";

import Link from "next/link";

import { people, socialActions, useSocial } from "@/entities/social";
import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";

export function ProfileFriends() {
  const { relations, shareActivity } = useSocial();
  const friends = people.filter((person) => relations[person.id] === "friend");
  const incoming = people.filter((person) => relations[person.id] === "incoming");
  const outgoing = people.filter((person) => relations[person.id] === "outgoing");

  return (
    <section aria-labelledby="friends-title" className="space-y-4 rounded-2xl border bg-card p-4">
      <h2 id="friends-title" className="text-lg font-semibold">
        Друзья
      </h2>
      <Label className="flex items-start gap-3 font-normal">
        <Checkbox
          className="mt-0.5"
          checked={shareActivity}
          onCheckedChange={(value) => socialActions.setShareActivity(value === true)}
        />
        <span className="text-sm leading-snug">
          Показывать друзьям выполненные практики. Можно выключить в любой момент.
        </span>
      </Label>

      {incoming.length > 0 && (
        <ul className="space-y-2">
          {incoming.map((person) => (
            <li key={person.id} className="space-y-2 rounded-xl bg-muted/50 p-3">
              <p className="text-sm font-medium">{person.name} хочет добавить вас в друзья</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => socialActions.acceptRequest(person.id)}>
                  Принять
                </Button>
                <Button size="sm" variant="outline" onClick={() => socialActions.declineRequest(person.id)}>
                  Отклонить
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ul className="space-y-1">
        {friends.map((person) => (
          <li key={person.id}>
            <Link
              href={`${routes.person}/${person.id}`}
              className="flex items-center justify-between rounded-lg px-1 py-2 text-sm hover:bg-muted"
            >
              <span>{person.name}</span>
              <span className="text-xs text-muted-foreground">профиль</span>
            </Link>
          </li>
        ))}
        {outgoing.map((person) => (
          <li key={person.id} className="flex items-center justify-between px-1 py-2 text-sm">
            <Link href={`${routes.person}/${person.id}`}>{person.name}</Link>
            <span className="text-xs text-muted-foreground">запрос отправлен</span>
          </li>
        ))}
      </ul>
      {friends.length === 0 && incoming.length === 0 && (
        <p className="text-sm text-muted-foreground">Пока никого нет — откройте профиль человека и отправьте запрос.</p>
      )}
    </section>
  );
}
