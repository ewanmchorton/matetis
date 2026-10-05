"use client";

import { useMemo, useState } from "react";
import { SearchX } from "lucide-react";

import { getStatePractices, PracticeCard } from "@/entities/practice";
import { useProgress } from "@/entities/progress";
import { cn } from "@/shared/lib/utils";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/ui/page-header";
import { SearchInput } from "@/shared/ui/search-input";

export function LibraryPracticesPage() {
  const { completedPracticeIds } = useProgress();
  const practices = getStatePractices();
  const states = useMemo(
    () => Array.from(new Set(practices.flatMap((p) => (p.state ? [p.state] : [])))),
    [practices],
  );
  const [query, setQuery] = useState("");
  const [state, setState] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const rows = practices.filter(
    (p) =>
      (!state || p.state === state) &&
      (!q || `${p.title} ${p.summary}`.toLowerCase().includes(q)),
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Практики по состоянию"
        description="Выберите практику под то, что чувствуете прямо сейчас"
      />
      <SearchInput value={query} onChange={setQuery} placeholder="Поиск практик" />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {[null, ...states].map((s) => (
          <button
            key={s ?? "all"}
            type="button"
            onClick={() => setState(s)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
              state === s
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card hover:bg-muted",
            )}
          >
            {s ?? "Все"}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Ничего не нашлось"
          description="Попробуйте другое слово или сбросьте фильтр."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((p) => (
            <PracticeCard
              key={p.id}
              practice={p}
              meta={p.state}
              done={completedPracticeIds.includes(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
