import { getPersonTypes } from "@/entities/person-type";

export function TypeDistribution({ byType }: { byType: Map<string, number> }) {
  const types = getPersonTypes();
  const max = Math.max(1, ...byType.values());

  return (
    <section className="rounded-xl border bg-card p-4 sm:p-5">
      <h2 className="mb-4 font-semibold">Распределение по 12 типам</h2>
      <ul className="space-y-2">
        {types.map((t) => {
          const count = byType.get(t.id) ?? 0;
          return (
            <li key={t.id} className="grid grid-cols-[7.5rem_1fr_2rem] items-center gap-3 text-sm">
              <span className="truncate text-muted-foreground">
                {t.number}. {t.name}
              </span>
              <span className="h-2 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </span>
              <span className="text-right tabular-nums">{count}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
