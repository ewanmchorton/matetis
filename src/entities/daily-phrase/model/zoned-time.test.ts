import { describe, expect, it } from "vitest";

import { localDay, localHourToMoment } from "./zoned-time";

describe("Время по часам телефона", () => {
  it("в Минске уже 25 декабря, когда в UTC ещё 24-е", () => {
    expect(localDay(new Date("2026-12-24T22:30:00Z"), "Europe/Minsk")).toBe("2026-12-25");
  });

  it("9:00 по Минску — это 6:00 по UTC", () => {
    expect(localHourToMoment("2026-12-25", 9, "Europe/Minsk").toISOString()).toBe("2026-12-25T06:00:00.000Z");
  });

  it("24:00 — это полночь следующего дня", () => {
    expect(localHourToMoment("2026-12-25", 24, "Europe/Minsk").toISOString()).toBe("2026-12-25T21:00:00.000Z");
  });

  it("учитывает переход на летнее время: 9:00 в Берлине до и после перевода часов", () => {
    expect(localHourToMoment("2026-03-28", 9, "Europe/Berlin").toISOString()).toBe("2026-03-28T08:00:00.000Z");
    expect(localHourToMoment("2026-03-29", 9, "Europe/Berlin").toISOString()).toBe("2026-03-29T07:00:00.000Z");
  });

  it("9:00 во Владивостоке наступает накануне по UTC", () => {
    expect(localHourToMoment("2026-12-25", 9, "Asia/Vladivostok").toISOString()).toBe("2026-12-24T23:00:00.000Z");
  });
});
