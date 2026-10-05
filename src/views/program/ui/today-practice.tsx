"use client";

import { Check, Clock, RotateCcw } from "lucide-react";

import type { DailyPractice } from "@/entities/practice";
import { progressActions } from "@/entities/progress";
import { Button } from "@/shared/ui/button";

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
        <p className="mt-2 text-muted-foreground">
          Практики для этой стихии пока готовятся.
        </p>
      </section>
    );
  }

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

      {done ? (
        <div className="space-y-2">
          <div className="flex h-12 items-center justify-center gap-2 rounded-lg bg-primary/10 font-medium text-primary">
            <Check className="size-5" />
            Выполнено. Отличная работа!
          </div>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => progressActions.togglePractice(todayKey)}
          >
            <RotateCcw />
            Отменить отметку
          </Button>
        </div>
      ) : (
        <Button
          size="lg"
          className="h-12 w-full text-base"
          onClick={() => progressActions.togglePractice(todayKey)}
        >
          <Check />
          Выполнено
        </Button>
      )}
    </section>
  );
}
