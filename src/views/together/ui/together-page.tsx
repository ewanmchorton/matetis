"use client";

import { useState } from "react";
import { Check, Heart } from "lucide-react";

import { progressActions } from "@/entities/progress";
import { feedEvents, getPerson, socialActions, useSocial } from "@/entities/social";
import { routes } from "@/shared/config/routes";
import { formatWeekDeadline, toDateKey } from "@/shared/lib/date";
import { useIsClient } from "@/shared/lib/use-is-client";
import { cn } from "@/shared/lib/utils";
import { InvitePanel } from "@/features/invite-practice";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";

export function TogetherPage() {
  const isClient = useIsClient();

  return (
    <main className="flex flex-1 flex-col gap-4 px-5 pt-6 pb-8">
      <header className="space-y-3">
        <Logo href={routes.program} />
        <h1 className="text-3xl font-semibold">Вместе</h1>
      </header>
      {isClient ? <TogetherContent /> : <div className="h-64 animate-pulse rounded-2xl bg-muted" aria-hidden />}
    </main>
  );
}

function TogetherContent() {
  const { invitations, reactions } = useSocial();
  const [inviteOpen, setInviteOpen] = useState(false);
  const today = new Date();
  const todayKey = toDateKey(today);
  const deadline = formatWeekDeadline(today);
  const active = invitations.filter((item) => item.status === "accepted");
  const incoming = invitations.filter((item) => item.status === "pending" && item.direction === "incoming");

  return (
    <>
      {active.map((item) => {
        const friend = getPerson(item.friendId);
        return (
          <section key={item.id} className="space-y-3 rounded-2xl bg-primary/10 p-4 ring-1 ring-primary/15">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-primary">Совместная практика</p>
              <h2 className="text-lg font-semibold leading-snug">{item.practiceTitle}</h2>
              <p className="text-sm text-muted-foreground">
                {friend?.name} · до {deadline}
              </p>
            </div>
            <ul className="space-y-1.5 text-sm">
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
                <span className="text-muted-foreground">{item.theirDone ? "готово" : "—"}</span>
              </li>
            </ul>
          </section>
        );
      })}

      <section aria-labelledby="feed-title" className="space-y-2">
        <h2 id="feed-title" className="text-lg font-semibold">
          События друзей
        </h2>
        <ul className="space-y-2">
          {feedEvents.map((event) => {
            const person = getPerson(event.personId);
            const reacted = Boolean(reactions[event.id]);
            return (
              <li key={event.id} className="space-y-2 rounded-2xl border bg-card p-3">
                <div className="flex gap-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {person?.name.slice(0, 1)}
                  </span>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-medium text-primary">{event.title}</p>
                    <p className="text-sm leading-snug">{event.text}</p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-pressed={reacted}
                  onClick={() => socialActions.toggleReaction(event.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
                    reacted ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground",
                  )}
                >
                  <Heart className={cn("size-3.5", reacted && "fill-primary")} />
                  {reacted ? "Вы поддержали" : "Поддержать"}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {incoming.map((item) => {
        const friend = getPerson(item.friendId);
        return (
          <section key={item.id} className="space-y-2 rounded-2xl border bg-card p-3">
            <p className="text-sm font-medium">
              {friend?.name} · «{item.practiceTitle}»
            </p>
            <p className="text-xs text-muted-foreground">до {deadline}</p>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => socialActions.respondInvite(item.id, true)}>
                Принять
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => socialActions.respondInvite(item.id, false)}>
                Отклонить
              </Button>
            </div>
          </section>
        );
      })}

      <Button variant="outline" className="w-full" onClick={() => setInviteOpen((value) => !value)}>
        Предложить практику
      </Button>
      {inviteOpen && <InvitePanel onClose={() => setInviteOpen(false)} />}
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
        "grid size-9 place-items-center rounded-full border-2",
        done ? "border-primary bg-primary text-primary-foreground" : "border-input text-transparent",
      )}
    >
      <Check className="size-4" />
    </button>
  );
}
