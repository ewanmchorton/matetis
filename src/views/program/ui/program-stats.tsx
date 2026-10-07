import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { pluralRu } from "@/entities/progress";
import { routes } from "@/shared/config/routes";

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-3 py-3">
      <p className="text-2xl font-semibold tabular-nums leading-none">{value}</p>
      <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{label}</p>
    </div>
  );
}

export function ProgramStats({
  practices,
  rituals,
  total,
  encouragement,
}: {
  practices: number;
  rituals: number;
  total: number;
  encouragement: string;
}) {
  return (
    <section aria-labelledby="stats-title" className="space-y-3 rounded-2xl border bg-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="stats-title" className="text-lg font-semibold">
          Статистика
        </h2>
        <span className="text-xs text-muted-foreground">за 7 дней</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <StatTile value={practices} label={pluralRu(practices, "практика дня", "практики дня", "практик дня")} />
        <StatTile value={rituals} label={pluralRu(rituals, "ритуал", "ритуала", "ритуалов")} />
        <StatTile value={total} label={`${pluralRu(total, "практика", "практики", "практик")} за всё время`} />
      </div>
      <p className="text-sm leading-relaxed">{encouragement}</p>
      <Link
        href={routes.profile}
        className="flex items-center justify-between rounded-lg text-sm font-medium text-primary"
      >
        Подробнее в профиле
        <ChevronRight className="size-4" />
      </Link>
    </section>
  );
}
