import { cn } from "@/shared/lib/utils";

/** Индикатор шагов: точки 8 px, текущий шаг — вытянутая точка 24 px. */
export function StepDots({ count, current, className }: { count: number; current: number; className?: string }) {
  return (
    <div
      className={cn("flex items-center justify-center gap-2", className)}
      role="img"
      aria-label={`Шаг ${current + 1} из ${count}`}
    >
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-2 rounded-full transition-all",
            index === current ? "w-6 bg-primary" : "w-2 bg-soft-sage",
          )}
        />
      ))}
    </div>
  );
}
