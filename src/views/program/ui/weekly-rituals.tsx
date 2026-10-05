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
  weekStartKey,
}: {
  rituals: WeeklyRitual[];
  ritualMarks: Record<string, string[]>;
  weekDays: Date[];
  todayKey: string;
  weekStartKey: string;
}) {
  const weekKeys = weekDays.map(toDateKey);

  return (
    <section aria-labelledby="rituals-title" className="space-y-3">
      <div className="space-y-1">
        <h2 id="rituals-title" className="text-lg font-semibold">
          Еженедельные ритуалы
        </h2>
        <p className="text-sm text-muted-foreground">
          Зарядка «Туата» — раз в неделю. Освоение предметов можно отмечать по дням, когда
          занимались.
        </p>
      </div>
      <ul className="space-y-3">
        {rituals.map((ritual) => {
          const marks = new Set(ritualMarks[ritual.id] ?? []);
          const isDaily = ritual.schedule === "daily";
          const doneToday = marks.has(todayKey);
          const doneThisWeek = marks.has(weekStartKey);

          return (
            <li key={ritual.id} className="space-y-3 rounded-2xl border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{ritual.title}</p>
                  <p className="text-sm text-muted-foreground">{ritual.description}</p>
                </div>
                <button
                  type="button"
                  aria-pressed={isDaily ? doneToday : doneThisWeek}
                  aria-label={
                    isDaily
                      ? doneToday
                        ? "Снять отметку за сегодня"
                        : "Отметить за сегодня"
                      : doneThisWeek
                        ? "Снять отметку за эту неделю"
                        : "Отметить на этой неделе"
                  }
                  onClick={() =>
                    isDaily
                      ? progressActions.toggleDailyRitual(ritual.id, todayKey)
                      : progressActions.toggleWeeklyRitual(ritual.id, weekStartKey)
                  }
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-full border-2 transition-colors",
                    (isDaily ? doneToday : doneThisWeek)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input text-transparent hover:border-primary/50 hover:text-primary/40",
                  )}
                >
                  <Check className="size-5" />
                </button>
              </div>
              {isDaily ? (
                <ul className="flex gap-1" aria-label="Дни недели">
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
              ) : (
                <p className="text-sm text-muted-foreground">
                  {doneThisWeek ? "На этой неделе отмечено" : "Можно отметить, когда сделаете"}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
