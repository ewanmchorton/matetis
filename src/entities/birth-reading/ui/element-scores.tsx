import type { ElementId } from "@/entities/element";

import { elementLevelLabels, type ElementScore } from "../model/calculate";

export const elementNames: Record<ElementId, string> = {
  earth: "Земля",
  metal: "Металл",
  water: "Вода",
  wood: "Дерево",
  fire: "Огонь",
};

/** Цвета стихий по схеме Жанны. Только для меток стихий, не для интерфейса. */
export const elementColors: Record<ElementId, { fill: string; text: string; stroke: string }> = {
  fire: { fill: "#d93a2f", text: "#ffffff", stroke: "#b32b22" },
  earth: { fill: "#f1c232", text: "#292c28", stroke: "#cfa21b" },
  metal: { fill: "#ffffff", text: "#292c28", stroke: "#9a9d97" },
  water: { fill: "#1c2140", text: "#ffffff", stroke: "#0f1328" },
  wood: { fill: "#2e7d32", text: "#ffffff", stroke: "#1f5a23" },
};

/** Список стихий в порядке круга Усин: цвет, название, количество цифр и оценка. */
export function ElementScoresList({ scores }: { scores: ElementScore[] }) {
  return (
    <ul className="divide-y">
      {scores.map((score) => (
        <li key={score.element} className="flex items-center gap-3 py-2.5 text-sm">
          <span
            aria-hidden
            className="size-3 shrink-0 rounded-full border"
            style={{ background: elementColors[score.element].fill, borderColor: elementColors[score.element].stroke }}
          />
          <span className="w-20 font-medium">{elementNames[score.element]}</span>
          <span className="w-6 text-right tabular-nums">{score.count}</span>
          <span className="text-muted-foreground">{elementLevelLabels[score.level]}</span>
        </li>
      ))}
    </ul>
  );
}
