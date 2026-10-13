"use client";

import Link from "next/link";

import { people, socialActions, useSocial } from "@/entities/social";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";

function friendInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

function FriendAvatar({
  person,
  pending = false,
}: {
  person: { id: string; name: string };
  pending?: boolean;
}) {
  return (
    <Link
      href={`${routes.person}/${person.id}`}
      className="flex w-[4.25rem] shrink-0 flex-col items-center gap-1.5 rounded-xl p-1 hover:bg-muted/60"
    >
      <Avatar
        size="lg"
        className={cn("size-14 text-base", pending && "opacity-60 after:border-dashed")}
      >
        <AvatarFallback className="bg-primary/10 font-medium text-primary">
          {friendInitial(person.name)}
        </AvatarFallback>
      </Avatar>
      <span className="w-full truncate text-center text-xs leading-tight">{person.name}</span>
      {pending && <span className="text-[10px] leading-none text-muted-foreground">ожидание</span>}
    </Link>
  );
}

export function ProfileFriends({ embedded = false }: { embedded?: boolean }) {
  const { relations, shareActivity } = useSocial();
  const friends = people.filter((person) => relations[person.id] === "friend");
  const incoming = people.filter((person) => relations[person.id] === "incoming");
  const outgoing = people.filter((person) => relations[person.id] === "outgoing");

  const body = (
    <>
      {!embedded && (
        <>
          <h2 id="friends-title" className="text-lg font-semibold">
            Друзья
          </h2>
          <Label className="flex items-center justify-between gap-3 font-normal">
            <span className="text-sm text-muted-foreground">Делиться прогрессом с друзьями</span>
            <Checkbox
              checked={shareActivity}
              onCheckedChange={(value) => socialActions.setShareActivity(value === true)}
              aria-label="Делиться прогрессом с друзьями"
            />
          </Label>
        </>
      )}

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

      {(friends.length > 0 || outgoing.length > 0) && (
        <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
          {friends.map((person) => (
            <FriendAvatar key={person.id} person={person} />
          ))}
          {outgoing.map((person) => (
            <FriendAvatar key={person.id} person={person} pending />
          ))}
        </div>
      )}

      {friends.length === 0 && incoming.length === 0 && outgoing.length === 0 && (
        <p className="text-sm text-muted-foreground">Пока никого нет — откройте профиль человека и отправьте запрос.</p>
      )}
    </>
  );

  if (embedded) {
    return <div className="space-y-4">{body}</div>;
  }

  return (
    <section aria-labelledby="friends-title" className="space-y-4 rounded-2xl border bg-card p-4">
      {body}
    </section>
  );
}
