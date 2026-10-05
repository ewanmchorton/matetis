import type { TestGroup } from "@/entities/type-test";
import { cn } from "@/shared/lib/utils";

export function SectionChoice({
  group,
  value,
  onChange,
}: {
  group: TestGroup;
  value: string | undefined;
  onChange: (sectionId: string) => void;
}) {
  return (
    <div className="grid gap-3" role="radiogroup" aria-label={group.title}>
      {group.sections.map((s, i) => {
        const selected = value === s.id;
        return (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(s.id)}
            className={cn(
              "flex gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/50",
              selected && "border-primary bg-primary/5 ring-2 ring-primary/20",
            )}
          >
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full border text-sm font-medium",
                selected && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {i + 1}
            </span>
            <span className="text-[15px] leading-relaxed">{s.text}</span>
          </button>
        );
      })}
    </div>
  );
}
