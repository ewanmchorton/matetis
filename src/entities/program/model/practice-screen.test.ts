import { describe, expect, it } from "vitest";

import { demoProgram } from "./demo-program";
import { isAudioPractice, numberedSteps, opensPracticeScreen } from "./practice-screen";

describe("экран практики", () => {
  it("пронумерованный текст превращается в шаги без номеров", () => {
    expect(numberedSteps("1. Закрываю глаза.\n2. Благодарю Космос и Землю.\n")).toEqual([
      "Закрываю глаза.",
      "Благодарю Космос и Землю.",
    ]);
  });

  it("обычный текст остаётся абзацем", () => {
    expect(numberedSteps("Перед сном отмотать кинопленку дня.")).toBeNull();
    expect(numberedSteps("1. Первый шаг.\nИ просто строка.")).toBeNull();
  });

  it("внутренняя улыбка открывается с плеером, мини-зарядка — не открывается", () => {
    const [smile, exercise] = demoProgram().morning;
    expect(isAudioPractice(smile)).toBe(true);
    expect(opensPracticeScreen(exercise)).toBe(false);
  });
});
