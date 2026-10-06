"use client";

import { useState } from "react";
import { Check, Heart } from "lucide-react";

import { progressActions } from "@/entities/progress";
import { feedEvents, getPerson, socialActions, useSocial } from "@/entities/social";
import { routes } from "@/shared/config/routes";
import { toDateKey } from "@/shared/lib/date";
import { useIsClient } from "@/shared/lib/use-is-client";
import { cn } from "@/shared/lib/utils";
import { InvitePanel } from "@/features/invite-practice";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";

export function TogetherPage() {
  const isClient = useIsClient();

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pt-6 pb-8">
      <header className="space-y-4">
        <Logo href={routes.program} />
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Вместе</h1>
          <p className="text-sm text-muted-foreground">
            Общая практика и события друзей. Друзей можно добавить в профиле.
          </p>
        </div>
      </header>
      {isClient ? <TogetherContent /> : <div className="h-64 animate-pulse rounded-2xl bg-muted" aria-hidden />}
    </main>
  );
}

function TogetherContent() {
  const { invitations, reactions, shareActivity } = useSocial();
  const [inviteOpen, setInviteOpen] = useState(false);
  const todayKey = toDateKey(new Date());
  const active = invitations.filter((item) => item.status === "accepted");
  const incoming = invitations.filter((item) => item.status === "pending" && item.direction === "incoming");
  const outgoing = invitations.filter((item) => item.status === "pending" && item.direction === "outgoing");

  return (
    <>
      {active.map((item) => {
        const friend = getPerson(item.friendId);
        const both = item.myDone && item.theirDone;
        return (
          <section key={item.id} className="space-y-4 rounded-3xl bg-primary/10 p-5 ring-1 ring-primary/15">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Совместная практика</p>
              <h2 className="text-xl font-semibold">{item.practiceTitle}</h2>
              <p className="text-sm text-muted-foreground">
                Вы и {friend?.name ?? "друг"} · каждый в своё время, до конца недели
              </p>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between gap-3">
                <span>Вы</span>
                <MarkButton
                  done={item.myDone}
                  label={item.myDone ? "Снять свою отметку" : "Отметить у себя"}
                  onClick={() => {
                    const done = socialActions.toggleMyPart(item.id);
                    if (done) progressActions.completePractice(todayKey);
                  }}
                />
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>{friend?.name}</span>
                <span className="text-muted-foreground">{item.theirDone ? "отметка есть" : "ещё впереди"}</span>
              </li>
            </ul>
            {both && (
              <p className="text-sm text-muted-foreground">Вы оба нашли время. Практика есть и в личной программе.</p>
            )}
          </section>
        );
      })}

      {incoming.map((item) => {
        const friend = getPerson(item.friendId);
        return (
          <section key={item.id} className="space-y-3 rounded-2xl border bg-card p-4">
            <p className="font-medium">
              {friend?.name} предлагает «{item.practiceTitle}»
            </p>
            <p className="text-sm text-muted-foreground">До конца недели, в удобное для вас время.</p>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => socialActions.respondInvite(item.id, true)}>
                Принять
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => socialActions.respondInvite(item.id, false)}>
                Отклонить
              </Button>
            </div>
          </section>
        );
      })}

      {outgoing.map((item) => (
        <p key={item.id} className="rounded-2xl border bg-card px-4 py-3 text-sm text-muted-foreground">
          Ждём ответа: {getPerson(item.friendId)?.name} · «{item.practiceTitle}»
        </p>
      ))}

      <Button variant="outline" className="w-full" onClick={() => setInviteOpen((value) => !value)}>
        Предложить практику
      </Button>
      {inviteOpen && <InvitePanel onClose={() => setInviteOpen(false)} />}

      <section aria-labelledby="feed-title" className="space-y-3">
        <h2 id="feed-title" className="text-lg font-semibold">
          События друзей
        </h2>
        {!shareActivity && (
          <p className="text-sm text-muted-foreground">Ваши выполнения друзья сейчас не видят.</p>
        )}
        <ul className="space-y-3">
          {feedEvents.map((event) => {
            const person = getPerson(event.personId);
            const reacted = Boolean(reactions[event.id]);
            return (
              <li key={event.id} className="space-y-3 rounded-2xl border bg-card p-4">
                <div className="flex gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 font-medium text-primary">
                    {person?.name.slice(0, 1)}
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-primary">{event.title}</p>
                    <p className="text-sm leading-relaxed">{event.text}</p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-pressed={reacted}
                  onClick={() => socialActions.toggleReaction(event.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm",
                    reacted ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground",
                  )}
                >
                  <Heart className={cn("size-4", reacted && "fill-primary")} />
                  {reacted ? "Вы поддержали" : "Поддержать"}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">В ленте только то, чем человек решил поделиться.</p>
      </section>
    </>
  );
}

function MarkButton({ done, label, onClick }: { done: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={done}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid size-10 place-items-center rounded-full border-2",
        done ? "border-primary bg-primary text-primary-foreground" : "border-input text-transparent",
      )}
    >
      <Check className="size-5" />
    </button>
  );
}
