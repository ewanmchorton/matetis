"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { getPerson, socialActions, useFriendship } from "@/entities/social";
import { routes } from "@/shared/config/routes";
import { buttonVariants } from "@/shared/ui/button";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";

export function PersonPage() {
  const params = useParams<{ id: string }>();
  const person = getPerson(params.id);
  const friendship = useFriendship(params.id);

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pt-6 pb-8">
      <Logo href={routes.profile} />
      {!person ? (
        <p className="text-muted-foreground">Такого профиля нет.</p>
      ) : (
        <section className="space-y-4 rounded-3xl border bg-card p-6">
          <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
            {person.name.slice(0, 1)}
          </span>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold">{person.name}</h1>
            <p className="text-sm text-muted-foreground">{person.about}</p>
          </div>
          {friendship === "none" && (
            <Button className="w-full" onClick={() => socialActions.sendRequest(person.id)}>
              Добавить в друзья
            </Button>
          )}
          {friendship === "outgoing" && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Запрос отправлен.</p>
              <Button variant="outline" className="w-full" onClick={() => socialActions.declineRequest(person.id)}>
                Отменить запрос
              </Button>
            </div>
          )}
          {friendship === "incoming" && (
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => socialActions.acceptRequest(person.id)}>
                Принять
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => socialActions.declineRequest(person.id)}>
                Отклонить
              </Button>
            </div>
          )}
          {friendship === "friend" && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Вы друзья.</p>
              <Link href={routes.together} className={buttonVariants({ variant: "outline", className: "w-full" })}>
                Предложить практику
              </Link>
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => socialActions.removeFriend(person.id)}>
                Удалить из друзей
              </Button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
