import { matetisLetters, toDateKey } from "@/shared/lib/date";
import { cn } from "@/shared/lib/utils";

/** Одна строка букв МАТЭТИС на текущую неделю. */
export function MatetisMarks({
  weekDays,
  todayKey,
  doneKeys,
}: {
  weekDays: Date[];
  todayKey: string;
  doneKeys: ReadonlySet<string>;
}) {
  return (
    <ul className="flex gap-1" aria-label="Дни недели">
      {weekDays.map((day, index) => {
        const key = toDateKey(day);
        const done = doneKeys.has(key);
        const isToday = key === todayKey;
        const letter = matetisLetters[index] ?? "";
        return (
          <li
            key={key}
            aria-label={`${letter}${isToday ? ", сегодня" : ""}${done ? ", сделано" : ""}`}
            className={cn(
              "grid size-8 place-items-center rounded-full text-xs font-semibold",
              done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              isToday && "outline outline-2 outline-offset-2 outline-primary",
            )}
          >
            {letter}
          </li>
        );
      })}
    </ul>
  );
}
