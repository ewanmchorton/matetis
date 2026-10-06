"use client";

import { ElementBadge, getCurrentElement, getElementGuide } from "@/entities/element";
import { getPersonType } from "@/entities/person-type";
import { weakElementIdFor } from "@/entities/birth";
import { filterRituals, filterSupport, pickDailyPractice, usePracticeCatalog } from "@/entities/practice";
import { getProgramStats, useProgress } from "@/entities/progress";
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
  const { typeId, completedPractices, ritualMarks, birthDate, supportDone } = useProgress();
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
          typeNumber={type?.number ?? 1}
          completedPractices={completedPractices}
          ritualMarks={ritualMarks}
          birthDate={birthDate}
          supportDone={supportDone}
        />
      ) : (
        <ProgramSkeleton />
      )}
    </main>
  );
}

function ProgramContent({
  typeNumber,
  completedPractices,
  ritualMarks,
  birthDate,
  supportDone,
}: {
  typeNumber: number;
  completedPractices: string[];
  ritualMarks: Record<string, string[]>;
  birthDate: string | null;
  supportDone: string[];
}) {
  const element = getCurrentElement();
  const catalog = usePracticeCatalog();
  const today = new Date();
  const todayKey = toDateKey(today);
  const weekDays = getWeekDays(today);
  const weekStartKey = getWeekStartKey(today);
  const practice = pickDailyPractice(catalog.practices, element.id, typeNumber, today);
  const stats = getProgramStats(completedPractices, ritualMarks, today);
  const weakElementId = weakElementIdFor(birthDate);
  const support = weakElementId ? filterSupport(catalog.support, weakElementId) : [];

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
        rituals={filterRituals(catalog.rituals, element.id)}
        supportItems={support.slice(0, 2)}
        supportDone={supportDone}
        ritualMarks={ritualMarks}
        weekDays={weekDays}
        todayKey={todayKey}
        weekStartKey={weekStartKey}
      />
      <ElementRecommendations element={element} guide={getElementGuide(element.id)} />
      <ProgramStats
        practices={stats.practices}
        rituals={stats.rituals}
        total={stats.total}
        encouragement={stats.encouragement}
      />
    </>
  );
}
