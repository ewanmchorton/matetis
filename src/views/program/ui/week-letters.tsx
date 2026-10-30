import { APP_WEEK_LETTERS } from "@/shared/config/brand";
import { cn } from "@/shared/lib/utils";

const dayNames = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

/** Буквы МАТЭТИС на неделю: буква заполняется, если в этот день была хотя бы одна практика. */
export function WeekLetters({ week, today }: { week: { day: string; done: boolean }[]; today: string }) {
  return (
    <ul className="grid grid-cols-7 gap-1" aria-label="Дни недели">
      {week.map(({ day, done }, index) => {
        const letter = APP_WEEK_LETTERS[index] ?? "";
        const isToday = day === today;
        return (
          <li
            key={day}
            className="flex flex-col items-center gap-1"
            aria-label={`${dayNames[index]}${isToday ? ", сегодня" : ""}${done ? ", сделано" : ""}`}
          >
            <span
              className={cn(
                "grid size-10 place-items-center rounded-full font-display text-[22px] leading-none font-medium",
                done ? "bg-primary text-primary-foreground" : "bg-secondary/70 text-muted-foreground",
                isToday && !done && "ring-1 ring-primary/40",
              )}
            >
              {letter}
            </span>
            <span className="type-caption text-muted-foreground">{dayNames[index]}</span>
          </li>
        );
      })}
    </ul>
  );
}
