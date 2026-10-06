"use client";

import { useState } from "react";
import { ArrowDown, Check, Clock, Sparkles } from "lucide-react";

import { allowsTogether, type DailyPractice } from "@/entities/practice";
import { progressActions } from "@/entities/progress";
import { socialActions } from "@/entities/social";
import { InvitePanel } from "@/features/invite-practice";
import { Button } from "@/shared/ui/button";

function scrollToRituals() {
  document.getElementById("weekly-rituals")?.scrollIntoView({ behavior: "smooth" });
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
      <TogetherNote practice={practice} />
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

function TogetherNote({ practice }: { practice: DailyPractice }) {
  const [open, setOpen] = useState(false);

  if (!allowsTogether(practice)) {
    return <p className="text-xs text-muted-foreground">Эта практика только для себя.</p>;
  }

  return (
    <div className="space-y-3">
      <Button variant="outline" className="w-full" onClick={() => setOpen((value) => !value)}>
        Предложить другу
      </Button>
      {open && <InvitePanel presetPracticeId={practice.id} onClose={() => setOpen(false)} />}
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
    <section
      aria-labelledby="today-practice-title"
      className="space-y-5 rounded-3xl bg-gradient-to-br from-primary/12 via-card to-amber-50 p-6 ring-1 ring-primary/10 dark:to-card"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-primary">Практика сегодня</p>
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="size-4" />
          {practice.duration}
        </span>
      </div>

      <div className="space-y-2">
        <h2 id="today-practice-title" className="text-2xl font-semibold leading-tight">
          {practice.title}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{practice.why}</p>
      </div>

      <ol className="space-y-2">
        {practice.steps.map((step, i) => (
          <li key={step} className="flex gap-3 text-sm leading-relaxed">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-background text-xs font-semibold text-primary ring-1 ring-primary/20">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <Button
        size="lg"
        className="h-12 w-full text-base"
        onClick={() => {
          progressActions.togglePractice(todayKey);
          socialActions.syncMyPart(practice.id, true);
        }}
      >
        <Check />
        Выполнено
      </Button>
      <TogetherNote practice={practice} />
    </section>
  );
}
