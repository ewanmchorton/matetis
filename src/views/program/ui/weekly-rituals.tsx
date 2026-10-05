"use client";

import { Check } from "lucide-react";

import type { WeeklyRitual } from "@/entities/practice";
import { progressActions } from "@/entities/progress";
import { toDateKey, weekDayShortNames } from "@/shared/lib/date";
import { cn } from "@/shared/lib/utils";

export function WeeklyRituals({
  rituals,
  ritualMarks,
  weekDays,
  todayKey,
}: {
  rituals: WeeklyRitual[];
  ritualMarks: Record<string, string[]>;
  weekDays: Date[];
  todayKey: string;
}) {
  const weekKeys = weekDays.map(toDateKey);

  return (
    <section aria-labelledby="rituals-title" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 id="rituals-title" className="text-lg font-semibold">
          Еженедельные ритуалы
        </h2>
        <span className="text-xs text-muted-foreground">эта неделя</span>
      </div>
      <ul className="space-y-3">
        {rituals.map((ritual) => {
          const marks = new Set(ritualMarks[ritual.id] ?? []);
          const doneThisWeek = weekKeys.filter((k) => marks.has(k)).length;
          const doneToday = marks.has(todayKey);
          const complete = doneThisWeek >= ritual.timesPerWeek;

          return (
            <li key={ritual.id} className="space-y-3 rounded-2xl border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{ritual.title}</p>
                  <p className="text-sm text-muted-foreground">{ritual.description}</p>
                </div>
                <button
                  type="button"
                  aria-pressed={doneToday}
                  aria-label={doneToday ? "Снять отметку за сегодня" : "Отметить за сегодня"}
                  onClick={() => progressActions.toggleRitual(ritual.id, todayKey)}
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-full border-2 transition-colors",
                    doneToday
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input text-transparent hover:border-primary/50 hover:text-primary/40",
                  )}
                >
                  <Check className="size-5" />
                </button>
              </div>
              <div className="flex items-center justify-between gap-3">
                <ul className="flex gap-1" aria-hidden>
                  {weekKeys.map((key, i) => (
                    <li
                      key={key}
                      className={cn(
                        "grid size-7 place-items-center rounded-full text-[10px] font-medium text-muted-foreground",
                        marks.has(key) ? "bg-primary/15 text-primary" : "bg-muted",
                        key === todayKey && "ring-2 ring-primary/40",
                      )}
                    >
                      {weekDayShortNames[i]}
                    </li>
                  ))}
                </ul>
                <span
                  className={cn(
                    "shrink-0 text-sm tabular-nums",
                    complete ? "font-medium text-primary" : "text-muted-foreground",
                  )}
                >
                  {doneThisWeek} из {ritual.timesPerWeek}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
