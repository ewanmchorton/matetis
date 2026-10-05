import { CircleCheck, Flame } from "lucide-react";

import { toDateKey, weekDayShortNames } from "@/shared/lib/date";
import { cn } from "@/shared/lib/utils";

function pluralDays(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дня";
  return "дней";
}

export function ProgramStats({
  streak,
  totalDone,
  completedDays,
  weekDays,
  todayKey,
}: {
  streak: number;
  totalDone: number;
  completedDays: string[];
  weekDays: Date[];
  todayKey: string;
}) {
  const done = new Set(completedDays);

  return (
    <section aria-labelledby="stats-title" className="space-y-3">
      <h2 id="stats-title" className="text-lg font-semibold">
        Статистика
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 rounded-2xl border bg-card p-4">
          <Flame className="size-5 text-amber-600" />
          <p className="text-3xl font-semibold tabular-nums">{streak}</p>
          <p className="text-sm text-muted-foreground">{pluralDays(streak)} подряд</p>
        </div>
        <div className="space-y-1 rounded-2xl border bg-card p-4">
          <CircleCheck className="size-5 text-primary" />
          <p className="text-3xl font-semibold tabular-nums">{totalDone}</p>
          <p className="text-sm text-muted-foreground">практик выполнено</p>
        </div>
      </div>
      <div className="space-y-2 rounded-2xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">Практика дня на этой неделе</p>
        <ul className="grid grid-cols-7 gap-1">
          {weekDays.map((day, i) => {
            const key = toDateKey(day);
            const isDone = done.has(key);
            return (
              <li key={key} className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full",
                    isDone ? "bg-primary text-primary-foreground" : "bg-muted",
                    key === todayKey && !isDone && "ring-2 ring-primary/40",
                  )}
                  aria-label={isDone ? "выполнено" : "не выполнено"}
                >
                  {isDone && <CircleCheck className="size-4" />}
                </span>
                <span className="text-[11px] text-muted-foreground">{weekDayShortNames[i]}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
