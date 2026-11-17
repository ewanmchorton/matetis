import { describe, expect, it } from "vitest";

import { answerExpired, isComeback, jointEndsOn, monthlyMatchDue, monthOf } from "./days";

describe("Дни совместных практик", () => {
  it("практика идёт 7 дней, включая день согласия", () => {
    expect(jointEndsOn("2026-11-18")).toBe("2026-11-24");
    expect(jointEndsOn("2026-11-28")).toBe("2026-12-04");
  });

  it("ответа ждём 3 суток", () => {
    const sent = new Date("2026-11-17T10:00:00Z");
    expect(answerExpired(sent, new Date("2026-11-20T09:59:59Z"))).toBe(false);
    expect(answerExpired(sent, new Date("2026-11-20T10:00:00Z"))).toBe(true);
  });

  it("предложение месяца – с 4-го числа", () => {
    expect(monthlyMatchDue("2026-11-03")).toBe(false);
    expect(monthlyMatchDue("2026-11-04")).toBe(true);
    expect(monthOf("2026-11-17")).toBe("2026-11-01");
  });

  it("возвращение – когда между отметками больше 7 дней без практики", () => {
    expect(isComeback("2026-11-01", "2026-11-09")).toBe(false); // 7 пустых дней
    expect(isComeback("2026-11-01", "2026-11-10")).toBe(true); // 8 пустых дней
  });
});
