import { describe, expect, it } from "vitest";

import { transitionBackground, transitionText } from "./screens";
import { stageForProgress } from "./stage";

describe("Состояние спутника", () => {
  it("пороги 18, 36, 54, 72 и 90 %", () => {
    expect(stageForProgress(0)).toBe(1);
    expect(stageForProgress(0.179)).toBe(1);
    expect(stageForProgress(0.18)).toBe(2);
    expect(stageForProgress(0.36)).toBe(3);
    expect(stageForProgress(0.54)).toBe(4);
    expect(stageForProgress(0.72)).toBe(5);
    expect(stageForProgress(0.899)).toBe(5);
    expect(stageForProgress(0.9)).toBe(6);
    expect(stageForProgress(1)).toBe(6);
  });

  it("текст превращения называет новое состояние", () => {
    expect(transitionText(4)).toEqual({
      caption: "Гармония · Соединение",
      title: "Всё соединяется внутри вас",
      text: "Ваш спутник меняется вместе с вами. Гармония переходит в Соединение.",
    });
    expect(transitionText(6).text).toBe("Ваш спутник меняется вместе с вами. Гармония переходит в Пробуждение.");
  });

  it("фоны превращения не повторяются подряд", () => {
    const backgrounds = ([2, 3, 4, 5, 6] as const).map(transitionBackground);
    backgrounds.slice(1).forEach((background, index) => expect(background).not.toBe(backgrounds[index]));
  });
});
