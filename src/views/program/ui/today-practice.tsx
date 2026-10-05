"use client";

import { Check, Clock, RotateCcw } from "lucide-react";

import type { DailyPractice } from "@/entities/practice";
import { progressActions } from "@/entities/progress";
import { cn } from "@/shared/lib/utils";
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
      className={cn(
        "space-y-5 rounded-3xl p-6 ring-1 transition-colors duration-300",
        done
          ? "bg-muted/50 ring-border/80"
          : "bg-gradient-to-br from-primary/12 via-card to-amber-50 ring-primary/10 dark:to-card",
      )}
    >
      <div
        className={cn(
          "space-y-5 transition-opacity duration-300",
          done && "opacity-55",
        )}
      >
        <div className="flex items-center justify-between">
          <p className={cn("text-sm font-medium", done ? "text-muted-foreground" : "text-primary")}>
            Практика сегодня
          </p>
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
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold ring-1",
                  done
                    ? "bg-muted text-muted-foreground ring-border"
                    : "bg-background text-primary ring-primary/20",
                )}
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

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
