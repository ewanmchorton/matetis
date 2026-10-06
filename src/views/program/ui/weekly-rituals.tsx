"use client";

import { Check } from "lucide-react";

import type { WeeklyRitual } from "@/entities/practice";
import { progressActions } from "@/entities/progress";
import { getPreviousWeekDays } from "@/shared/lib/date";
import { cn } from "@/shared/lib/utils";
import { MatetisMarks } from "@/shared/ui/matetis-marks";

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
  return (
    <section id="weekly-rituals" aria-labelledby="rituals-title" className="scroll-mt-16 space-y-3">
      <div className="space-y-1">
        <h2 id="rituals-title" className="text-lg font-semibold">
          Еженедельные ритуалы
        </h2>
        <p className="text-sm text-muted-foreground">
          Зарядка «Туата» — раз в неделю. У ежедневных занятий дни показаны буквами МАТЭТИС:
          закрашивается сделанное, новая неделя начинает новый ряд.
        </p>
      </div>
      <ul className="space-y-3">
        {rituals.map((ritual) => {
          const marks = new Set(ritualMarks[ritual.id] ?? []);
          const isDaily = ritual.schedule === "daily";
          const doneToday = marks.has(todayKey);
          const doneThisWeek = marks.has(weekStartKey);
          const done = isDaily ? doneToday : doneThisWeek;

          return (
            <li
              key={ritual.id}
              className={cn(
                "space-y-3 rounded-2xl border p-4 transition-colors duration-300",
                done ? "bg-muted/60" : "bg-card",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "min-w-0 flex-1 transition-opacity duration-300",
                    done && "opacity-50",
                  )}
                >
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
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input text-transparent hover:border-primary/50 hover:text-primary/40",
                  )}
                >
                  <Check className="size-5" />
                </button>
              </div>
              {isDaily ? (
                <div className={cn("transition-opacity duration-300", done && "opacity-60")}>
                  <MatetisMarks
                    weeks={[weekDays, getPreviousWeekDays(weekDays[0] ?? new Date())]}
                    todayKey={todayKey}
                    doneKeys={marks}
                  />
                </div>
              ) : (
                <p className={cn("text-sm text-muted-foreground", done && "opacity-60")}>
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
