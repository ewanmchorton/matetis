import { describe, expect, it } from "vitest";

import { journalDate } from "./journal";

describe("Дата записи журнала", () => {
  it("пишется днём, месяцем и годом", () => {
    expect(journalDate("2026-11-22")).toBe("22 ноября 2026");
    expect(journalDate("2026-03-01")).toBe("1 марта 2026");
  });
});
