"use client";

import { ElementBadge, getCurrentElement, getElementGuide } from "@/entities/element";
import { getPersonType } from "@/entities/person-type";
import { getDailyPractice, getWeeklyRituals } from "@/entities/practice";
import { getSoftProgramNote, useProgress } from "@/entities/progress";
import { routes } from "@/shared/config/routes";
import { getWeekDays, getWeekStartKey, toDateKey } from "@/shared/lib/date";
import { useIsClient } from "@/shared/lib/use-is-client";
import { Logo } from "@/shared/ui/logo";

import { ElementRecommendations } from "./element-recommendations";
import { ProgramStats } from "./program-stats";
import { TodayPractice } from "./today-practice";
import { WeeklyRituals } from "./weekly-rituals";

function ProgramSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-96 animate-pulse rounded-3xl bg-muted" />
      <div className="h-32 animate-pulse rounded-2xl bg-muted" />
      <div className="h-32 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}

export function ProgramPage() {
  const isClient = useIsClient();
  const { typeId, completedPractices, ritualMarks } = useProgress();
  const type = getPersonType(typeId ?? "t1");
  const element = getCurrentElement();

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pt-6 pb-8">
      <header className="space-y-4">
        <Logo href={routes.program} />
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Программа</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {type && <span>Тип «{type.name}»</span>}
            <span aria-hidden>·</span>
            <span>стихия</span>
            <ElementBadge element={element} />
          </div>
        </div>
      </header>

      {isClient ? (
        <ProgramContent
          completedPractices={completedPractices}
          ritualMarks={ritualMarks}
        />
      ) : (
        <ProgramSkeleton />
      )}
    </main>
  );
}

function ProgramContent({
  completedPractices,
  ritualMarks,
}: {
  completedPractices: string[];
  ritualMarks: Record<string, string[]>;
}) {
  const element = getCurrentElement();
  const today = new Date();
  const todayKey = toDateKey(today);
  const weekDays = getWeekDays(today);
  const weekStartKey = getWeekStartKey(today);
  const practice = getDailyPractice(element.id);

  return (
    <>
      <p className="-mt-3 text-sm text-muted-foreground first-letter:uppercase">
        {today.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}
      </p>
      <TodayPractice
        practice={practice}
        todayKey={todayKey}
        done={completedPractices.includes(todayKey)}
      />
      <WeeklyRituals
        rituals={getWeeklyRituals(element.id)}
        ritualMarks={ritualMarks}
        weekDays={weekDays}
        todayKey={todayKey}
        weekStartKey={weekStartKey}
      />
      <ElementRecommendations element={element} guide={getElementGuide(element.id)} />
      <ProgramStats note={getSoftProgramNote(completedPractices, weekDays)} />
    </>
  );
}
