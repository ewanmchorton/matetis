import { matetisLetters, toDateKey } from "@/shared/lib/date";
import { cn } from "@/shared/lib/utils";

/** Ряды букв МАТЭТИС: текущая неделя и сохранённые предыдущие. */
export function MatetisMarks({
  weeks,
  todayKey,
  doneKeys,
}: {
  /** Сначала текущая неделя, ниже — более ранние. */
  weeks: Date[][];
  todayKey: string;
  doneKeys: ReadonlySet<string>;
}) {
  return (
    <div className="space-y-1.5">
      {weeks.map((days, row) => (
        <ul key={toDateKey(days[0] ?? new Date())} className="flex gap-1" aria-label={row === 0 ? "Эта неделя" : "Прошлая неделя"}>
          {days.map((day, index) => {
            const key = toDateKey(day);
            const done = doneKeys.has(key);
            const isToday = key === todayKey;
            const letter = matetisLetters[index] ?? "";
            return (
              <li
                key={key}
                aria-label={`${letter}${isToday ? ", сегодня" : ""}${done ? ", сделано" : ""}`}
                className={cn(
                  "grid place-items-center rounded-full font-semibold",
                  row === 0 ? "size-8 text-xs" : "size-7 text-[11px] opacity-80",
                  done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  isToday && "outline outline-2 outline-offset-2 outline-primary",
                )}
              >
                {letter}
              </li>
            );
          })}
        </ul>
      ))}
    </div>
  );
}
