import { describe, expect, it } from "vitest";

import { demoProgram } from "./demo-program";
import { awarenessPreview, isAudioPractice, numberedSteps, opensPracticeScreen } from "./practice-screen";

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

  it("на карточке – первое предложение, длинное обрезается по словам", () => {
    expect(awarenessPreview("Короткое предложение. Дальше ещё текст.")).toBe("Короткое предложение.");
    const preview = awarenessPreview(demoProgram().awareness[0].body);
    expect(preview).toBe(
      "Рядом живут черные клены и розовые магнолии, – и всё вместе, будучи таким ярким контрастом…",
    );
  });

  it("внутренняя улыбка открывается с плеером, мини-зарядка – не открывается", () => {
    const [smile, exercise] = demoProgram().morning;
    expect(isAudioPractice(smile)).toBe(true);
    expect(opensPracticeScreen(exercise)).toBe(false);
  });
});
