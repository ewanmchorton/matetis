"use client";

import { Check } from "lucide-react";

import type { SupportPractice, WeeklyRitual } from "@/entities/practice";
import { progressActions } from "@/entities/progress";
import { cn } from "@/shared/lib/utils";
import { MatetisMarks } from "@/shared/ui/matetis-marks";

export function WeeklyRituals({
  rituals,
  supportItems,
  supportDone,
  ritualMarks,
  weekDays,
  todayKey,
  weekStartKey,
}: {
  rituals: WeeklyRitual[];
  supportItems: SupportPractice[];
  supportDone: string[];
  ritualMarks: Record<string, string[]>;
  weekDays: Date[];
  todayKey: string;
  weekStartKey: string;
}) {
  return (
    <section id="weekly-rituals" aria-labelledby="rituals-title" className="scroll-mt-16 space-y-3">
      <h2 id="rituals-title" className="text-lg font-semibold">
        Еженедельные ритуалы
      </h2>
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
                <MarkButton
                  done={isDaily ? doneToday : doneThisWeek}
                  label={ritual.title}
                  onClick={() =>
                    isDaily
                      ? progressActions.toggleDailyRitual(ritual.id, todayKey)
                      : progressActions.toggleWeeklyRitual(ritual.id, weekStartKey)
                  }
                />
              </div>
              {isDaily && (
                <div className={cn("transition-opacity duration-300", done && "opacity-60")}>
                  <MatetisMarks weekDays={weekDays} todayKey={todayKey} doneKeys={marks} />
                </div>
              )}
            </li>
          );
        })}
        {supportItems.map((item) => {
          const done = supportDone.includes(item.id);
          return (
            <li
              key={item.id}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-4 transition-colors",
                done ? "bg-muted/60" : "bg-card",
              )}
            >
              <div className={cn("min-w-0 flex-1", done && "opacity-50")}>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {item.duration}
                  {item.note ? ` · ${item.note}` : ""}
                </p>
              </div>
              <MarkButton
                done={done}
                label={item.title}
                onClick={() => progressActions.toggleSupport(item.id)}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function MarkButton({ done, label, onClick }: { done: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={done}
      aria-label={done ? `Снять «${label}»` : `Отметить «${label}»`}
      onClick={onClick}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full border-2 transition-colors",
        done
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input text-transparent hover:border-primary/50 hover:text-primary/40",
      )}
    >
      <Check className="size-5" />
    </button>
  );
}
