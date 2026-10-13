"use client";

import { useState } from "react";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";

import type { SupportPractice, WeeklyRitual } from "@/entities/practice";
import { progressActions } from "@/entities/progress";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { MatetisMarks } from "@/shared/ui/matetis-marks";

function RitualDetail({
  title,
  text,
  steps,
  done,
  onClose,
  onToggle,
}: {
  title: string;
  text: string;
  steps?: string[];
  done: boolean;
  onClose: () => void;
  onToggle: () => void;
}) {
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
          <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
        </div>
        {steps && steps.length > 0 && (
          <ol className="space-y-2">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-relaxed">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        )}
        <Button
          size="lg"
          className="h-12 w-full text-base"
          variant={done ? "outline" : "default"}
          onClick={onToggle}
        >
          <Check />
          {done ? "Снять отметку" : "Выполнено"}
        </Button>
      </div>
    </div>
  );
}

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
  const [openId, setOpenId] = useState<string | null>(null);
  const openRitual = rituals.find((ritual) => ritual.id === openId);
  const openSupport = supportItems.find((item) => item.id === openId);

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
                <button
                  type="button"
                  className={cn(
                    "flex min-w-0 flex-1 items-start gap-2 text-left transition-opacity duration-300",
                    done && "opacity-50",
                  )}
                  onClick={() => setOpenId(ritual.id)}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{ritual.title}</span>
                    <span className="block text-sm text-muted-foreground">{ritual.description}</span>
                  </span>
                  <ChevronRight className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                </button>
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
              <button
                type="button"
                className={cn(
                  "flex min-w-0 flex-1 items-start gap-2 text-left",
                  done && "opacity-50",
                )}
                onClick={() => setOpenId(item.id)}
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{item.title}</span>
                  <span className="block text-sm text-muted-foreground">
                    {item.duration}
                    {item.note ? ` · ${item.note}` : ""}
                  </span>
                </span>
                <ChevronRight className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              </button>
              <MarkButton
                done={done}
                label={item.title}
                onClick={() => progressActions.toggleSupport(item.id)}
              />
            </li>
          );
        })}
      </ul>
      {openRitual && (
        <RitualDetail
          title={openRitual.title}
          text={openRitual.description}
          steps={openRitual.steps}
          done={
            openRitual.schedule === "daily"
              ? (ritualMarks[openRitual.id] ?? []).includes(todayKey)
              : (ritualMarks[openRitual.id] ?? []).includes(weekStartKey)
          }
          onClose={() => setOpenId(null)}
          onToggle={() =>
            openRitual.schedule === "daily"
              ? progressActions.toggleDailyRitual(openRitual.id, todayKey)
              : progressActions.toggleWeeklyRitual(openRitual.id, weekStartKey)
          }
        />
      )}
      {openSupport && (
        <RitualDetail
          title={openSupport.title}
          text={`${openSupport.duration}${openSupport.note ? `. ${openSupport.note}` : ""}`}
          done={supportDone.includes(openSupport.id)}
          onClose={() => setOpenId(null)}
          onToggle={() => progressActions.toggleSupport(openSupport.id)}
        />
      )}
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
