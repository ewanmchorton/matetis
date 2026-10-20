import { describe, expect, it } from "vitest";

import { initialReminderState, markShown, REMIND_INTERVAL_MS, shouldRemind } from "./reminder";

const day = 24 * 60 * 60 * 1000;
const start = Date.UTC(2026, 9, 20);

describe("Напоминание установить приложение", () => {
  it("после теста — один раз", () => {
    expect(shouldRemind("after-test", initialReminderState, start)).toBe(true);
    const shown = markShown("after-test", initialReminderState, start);
    expect(shouldRemind("after-test", shown, start + 10 * day)).toBe(false);
  });

  it("при возвращении — не раньше чем через 3 дня после прошлого показа", () => {
    const afterOnboarding = markShown("onboarding", initialReminderState, start);
    expect(shouldRemind("return", afterOnboarding, start + 2 * day)).toBe(false);
    expect(shouldRemind("return", afterOnboarding, start + REMIND_INTERVAL_MS)).toBe(true);
  });

  it("при возвращении — не больше 3 раз, онбординг и тест не считаются", () => {
    let state = markShown("onboarding", initialReminderState, start);
    state = markShown("after-test", state, start);
    for (let i = 1; i <= 3; i++) {
      const now = start + i * REMIND_INTERVAL_MS;
      expect(shouldRemind("return", state, now)).toBe(true);
      state = markShown("return", state, now);
    }
    expect(shouldRemind("return", state, start + 10 * REMIND_INTERVAL_MS)).toBe(false);
  });

  it("первое возвращение без прошлых показов — напоминаем", () => {
    expect(shouldRemind("return", initialReminderState, start)).toBe(true);
  });
});
