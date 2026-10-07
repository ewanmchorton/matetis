"use client";

import { useState } from "react";
import { ArrowDown, ArrowLeft, Check, ChevronRight, Clock, Sparkles } from "lucide-react";

import { allowsTogether, type DailyPractice } from "@/entities/practice";
import { progressActions } from "@/entities/progress";
import { socialActions } from "@/entities/social";
import { InvitePanel } from "@/features/invite-practice";
import { Button } from "@/shared/ui/button";

function scrollToRituals() {
  document.getElementById("weekly-rituals")?.scrollIntoView({ behavior: "smooth" });
}

function markDone(practiceId: string, todayKey: string) {
  progressActions.togglePractice(todayKey);
  socialActions.syncMyPart(practiceId, true);
}

function PracticeDone({ todayKey, practice }: { todayKey: string; practice: DailyPractice }) {
  return (
    <section
      aria-live="polite"
      className="space-y-4 rounded-3xl bg-primary/10 p-6 text-center ring-1 ring-primary/15"
    >
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">
        <Sparkles className="size-6" />
      </span>
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold">Вы молодец!</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Практика на сегодня выполнена. Возвращайтесь завтра — или переходите к еженедельным
          ритуалам.
        </p>
      </div>
      <Button size="lg" className="h-11 w-full text-base" onClick={scrollToRituals}>
        К еженедельным ритуалам
        <ArrowDown />
      </Button>
      <button
        type="button"
        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        onClick={() => {
          progressActions.togglePractice(todayKey);
          socialActions.syncMyPart(practice.id, false);
        }}
      >
        Отметили по ошибке? Вернуть практику
      </button>
    </section>
  );
}

function PracticeDetail({
  practice,
  todayKey,
  onClose,
}: {
  practice: DailyPractice;
  todayKey: string;
  onClose: () => void;
}) {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-40 mx-auto flex w-full max-w-[390px] flex-col bg-background">
      <div className="flex items-center gap-2 px-3 pt-4">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft />
          Назад
        </Button>
      </div>
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pt-2 pb-8">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="size-4" />
            {practice.duration}
          </p>
          <h1 className="text-3xl font-semibold leading-tight">{practice.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{practice.summary}</p>
        </div>
        <ol className="space-y-2">
          {practice.steps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-relaxed">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-primary">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <Button size="lg" className="h-12 w-full text-base" onClick={() => markDone(practice.id, todayKey)}>
          <Check />
          Выполнено
        </Button>
        {allowsTogether(practice) ? (
          <div className="space-y-3">
            <Button variant="outline" className="w-full" onClick={() => setInviteOpen((value) => !value)}>
              Предложить другу
            </Button>
            {inviteOpen && <InvitePanel presetPracticeId={practice.id} onClose={() => setInviteOpen(false)} />}
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground">Эта практика только для себя.</p>
        )}
      </div>
    </div>
  );
}

export function TodayPractice({
  practice,
  todayKey,
  done,
}: {
  practice: DailyPractice | undefined;
  todayKey: string;
  done: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!practice) {
    return (
      <section className="rounded-3xl border bg-card p-6">
        <p className="text-sm font-medium text-primary">Практика сегодня</p>
        <p className="mt-2 text-muted-foreground">Практики для этой стихии пока готовятся.</p>
      </section>
    );
  }

  if (done) return <PracticeDone todayKey={todayKey} practice={practice} />;

  return (
    <>
      <section className="space-y-4 rounded-3xl bg-gradient-to-br from-primary/12 via-card to-amber-50 p-5 ring-1 ring-primary/10 dark:to-card">
        <button type="button" className="w-full space-y-3 text-left" onClick={() => setOpen(true)}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-primary">Практика сегодня</p>
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="size-4" />
              {practice.duration}
            </span>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold leading-tight">{practice.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{practice.summary}</p>
            </div>
            <ChevronRight className="mb-1 size-5 shrink-0 text-muted-foreground" />
          </div>
        </button>
        <Button size="lg" className="h-12 w-full text-base" onClick={() => markDone(practice.id, todayKey)}>
          <Check />
          Выполнено
        </Button>
      </section>
      {open && <PracticeDetail practice={practice} todayKey={todayKey} onClose={() => setOpen(false)} />}
    </>
  );
}
