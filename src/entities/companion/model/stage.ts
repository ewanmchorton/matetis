// Спутник «Гармония»: 6 состояний за период стихии. docs/tasks/09-character/designer-brief.md.

export type CompanionStage = 1 | 2 | 3 | 4 | 5 | 6;

export const stageNames: Record<CompanionStage, string> = {
  1: "Пробуждение",
  2: "Раскрытие",
  3: "Течение",
  4: "Соединение",
  5: "Расцвет",
  6: "Пробуждение",
};

/** С какой доли пройденной программы стихии начинаются состояния 2–6. */
const STAGE_THRESHOLDS = [0.18, 0.36, 0.54, 0.72, 0.9];

/** Состояние спутника по доле пройденной программы стихии (0–1). */
export function stageForProgress(progress: number): CompanionStage {
  return (1 + STAGE_THRESHOLDS.filter((threshold) => progress >= threshold).length) as CompanionStage;
}

export function isCompanionStage(value: unknown): value is CompanionStage {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 6;
}
