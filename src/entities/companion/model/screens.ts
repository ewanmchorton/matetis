// Тексты и фоны экранов превращения и новой стихии. Тексты под каждую стихию – в docs/copywriter-brief.md.
import type { ElementId } from "@/entities/element";

import { stageNames, type CompanionStage } from "./stage";

/** Какой экран спутника показать поверх программы. */
export type CompanionScreen =
  | { kind: "transition"; from: CompanionStage; to: TransitionStage }
  | { kind: "new-period"; elementId: ElementId };

export type TransitionStage = Exclude<CompanionStage, 1>;

const transitionTitles: Record<TransitionStage, string> = {
  2: "Что-то внутри начинает раскрываться",
  3: "Всё приходит в движение",
  4: "Всё соединяется внутри вас",
  5: "Всё, что вы растили, расцветает",
  6: "Пройдя путь, вы возвращаетесь к истоку",
};

export function transitionText(stage: TransitionStage) {
  return {
    caption: `Гармония · ${stageNames[stage]}`,
    title: transitionTitles[stage],
    text: `Ваш спутник меняется вместе с вами. Гармония переходит в ${stageNames[stage]}.`,
  };
}

export const newPeriodText = {
  title: "Новый виток вашего пути",
  text: "Гармония снова в Пробуждении. Начинаем новый цикл вместе.",
};

/** Фоны превращения сменяют друг друга от состояния к состоянию. */
const transitionBackgrounds = ["07_transition_curtains", "07_transition_steps", "07_transition_path"] as const;

export function transitionBackground(stage: TransitionStage) {
  return transitionBackgrounds[(stage - 2) % transitionBackgrounds.length];
}
