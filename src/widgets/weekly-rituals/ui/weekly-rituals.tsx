"use client";

import { getCurrentElement } from "@/entities/element";
import { getProgram } from "@/entities/practice";
import { useProgress } from "@/entities/progress";
import { RitualCheckItem } from "@/features/toggle-ritual";

export function WeeklyRituals() {
  const { typeId, completedRitualIds } = useProgress();
  const { rituals } = getProgram(typeId ?? "t1", getCurrentElement().id);
  const done = rituals.filter((r) => completedRitualIds.includes(r.id)).length;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Ритуалы недели</h2>
        <span className="text-sm text-muted-foreground tabular-nums">
          {done} из {rituals.length}
        </span>
      </div>
      {rituals.length === 0 ? (
        <p className="text-sm text-muted-foreground">На этой неделе ритуалов нет.</p>
      ) : (
        <div className="grid gap-2">
          {rituals.map((r) => (
            <RitualCheckItem key={r.id} ritual={r} />
          ))}
        </div>
      )}
    </section>
  );
}
