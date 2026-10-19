/** «Шаг 2 из 4», справа подпись (например, «Группа 1»), под ними полоса прогресса. */
export function StepProgress({ current, total, label }: { current: number; total: number; label?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-4 type-caption text-muted-foreground">
        <span>
          Шаг {current} из {total}
        </span>
        {label && <span>{label}</span>}
      </div>
      <div
        className="h-1 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-label="Прогресс теста"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
      >
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(current / total) * 100}%` }} />
      </div>
    </div>
  );
}
