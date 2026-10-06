import type { ElementId } from "@/entities/element";

/**
 * Иллюстрация экрана, не расчёт.
 * Формулу квадрата Пифагора, распределение по пяти стихиям и правило слабой стихии
 * (включая несколько одинаково слабых) ещё нужно зафиксировать. До этого дата рождения
 * только включает или выключает дополнительный блок.
 */
export const demoWeakElementId: ElementId = "wood";

export function weakElementIdFor(birthDate: string | null): ElementId | null {
  return birthDate ? demoWeakElementId : null;
}

/** Цифры для варианта «показать квадрат». Намеренно не выводятся из даты. */
export const demoSquare = [
  ["11", "4", "7"],
  ["2", "55", "8"],
  ["33", "—", "9"],
] as const;

export const demoElementShares: { id: ElementId; value: number }[] = [
  { id: "wood", value: 1 },
  { id: "fire", value: 4 },
  { id: "earth", value: 3 },
  { id: "metal", value: 3 },
  { id: "water", value: 5 },
];

export const demoTraits = ["Осторожность", "Глубина", "Потребность в опоре"];
