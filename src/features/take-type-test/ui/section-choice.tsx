import type { TestGroup } from "@/entities/type-test";
import { cn } from "@/shared/lib/utils";

/** Описания группы карточками: номер в кружке и текст. Выбрать можно одно. */
export function SectionChoice({
  group,
  value,
  onChange,
  markers,
}: {
  group: TestGroup;
  /** Подписи в кружках вместо цифр 1, 2, 3… */
  markers?: string[];
  value: string | undefined;
  onChange: (sectionId: string) => void;
}) {
  return (
    <div className="grid gap-3" role="radiogroup" aria-label={group.title}>
      {group.sections.map((section, index) => {
        const selected = value === section.id;
        return (
          <button
            key={section.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(section.id)}
            className={cn(
              // Без размытия фона: на телефоне размытие под несколькими большими карточками
              // тормозит прокрутку, и нажатие срабатывает с задержкой. Фон плотнее, чтобы текст читался.
              "flex touch-manipulation gap-3 rounded-3xl border p-5 text-left shadow-[0_2px_12px_rgb(41_44_40/0.05)]",
              selected
                ? "border-primary bg-[color-mix(in_oklab,var(--primary)_10%,rgb(250_247_242/0.92))] ring-1 ring-primary"
                : "border-white/60 bg-background/85",
            )}
          >
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full border type-caption tabular-nums",
                selected ? "border-primary bg-primary text-primary-foreground" : "border-foreground/25 text-foreground",
              )}
            >
              {markers?.[index] ?? index + 1}
            </span>
            <span className="type-secondary text-foreground">{section.text}</span>
          </button>
        );
      })}
    </div>
  );
}
