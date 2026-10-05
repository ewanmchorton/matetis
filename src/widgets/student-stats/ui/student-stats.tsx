"use client";

import { CalendarCheck, Flame, Repeat, Trophy } from "lucide-react";

import { getCurrentElement } from "@/entities/element";
import { currentElementDay, getProgram } from "@/entities/practice";
import { useProgress } from "@/entities/progress";
import { cn } from "@/shared/lib/utils";
import { Progress } from "@/shared/ui/progress";
import { StatCard } from "@/shared/ui/stat-card";

// Сколько практик ученик выполнил до текущей сессии прототипа (демо).
const HISTORY_DONE = 8;
const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const weekMarks = [true, true, false, true, true, false, false];

export function StudentStats() {
  const { typeId, completedPracticeIds, completedRitualIds } = useProgress();
  const { daily, rituals } = getProgram(typeId ?? "t1", getCurrentElement().id);

  const dailyDone = daily.filter((p) => completedPracticeIds.includes(p.id)).length;
  const ritualsDone = rituals.filter((r) => completedRitualIds.includes(r.id)).length;
  const totalDone = HISTORY_DONE + completedPracticeIds.length + completedRitualIds.length;
  const dailyPercent = Math.round(((HISTORY_DONE + dailyDone) / currentElementDay) * 100);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Моя статистика</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Выполнено практик" value={totalDone} icon={Trophy} hint="за всё время" />
        <StatCard
          label="Ежедневные"
          value={`${Math.min(dailyPercent, 100)}%`}
          icon={CalendarCheck}
          hint={`дней в стихии: ${currentElementDay}`}
        />
        <StatCard
          label="Ритуалы недели"
          value={`${ritualsDone}/${rituals.length}`}
          icon={Repeat}
        />
        <StatCard label="Серия" value="2 дня" icon={Flame} hint="подряд без пропусков" />
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="mb-3 text-sm font-medium">Эта неделя</p>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((d, i) => (
            <div key={d} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-full border text-xs",
                  weekMarks[i] && "border-primary bg-primary text-primary-foreground",
                  i === 0 && "ring-2 ring-primary/30 ring-offset-2 ring-offset-card",
                )}
              >
                {weekMarks[i] ? "✓" : ""}
              </span>
              <span className="text-xs text-muted-foreground">{d}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <Progress value={(dailyDone / (daily.length || 1)) * 100}>
          <span className="text-sm font-medium">Программа стихии пройдена</span>
          <span className="ml-auto text-sm text-muted-foreground tabular-nums">
            {dailyDone} из {daily.length}
          </span>
        </Progress>
      </div>
    </section>
  );
}
