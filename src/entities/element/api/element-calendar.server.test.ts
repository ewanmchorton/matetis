import { beforeEach, describe, expect, it } from "vitest";

import { clearDatabase, createPerson } from "../../../../tests/people";
import { getCurrentSeason, getElementCalendarForStaff, setMetalStart } from "./element-calendar.server";

const august = new Date("2026-08-20T12:00:00+03:00");
const lateOctober = new Date("2026-10-28T12:00:00+03:00");

let manager: string;
let anna: string;

beforeEach(async () => {
  await clearDatabase();
  manager = await createPerson("Мария", "content_manager");
  anna = await createPerson("Анна");
});

describe("День перехода с Земли на Металл", () => {
  it("пока день не задан, вся осень — Земля", async () => {
    expect((await getCurrentSeason(lateOctober)).elementId).toBe("earth");
  });

  it("контент-менеджер задаёт день заранее — с него идёт Металл", async () => {
    await setMetalStart(manager, "2026-10-14", august);
    expect((await getCurrentSeason(new Date("2026-10-13T23:00:00+03:00"))).elementId).toBe("earth");
    expect((await getCurrentSeason(lateOctober)).elementId).toBe("metal");
    expect((await getElementCalendarForStaff(manager, august)).metalStartsOn).toBe("2026-10-14");
  });

  it("за 5 дней до дня Металла начинается фон перехода", async () => {
    await setMetalStart(manager, "2026-10-14", august);
    expect((await getCurrentSeason(new Date("2026-10-10T12:00:00+03:00"))).background).toEqual({
      kind: "transition",
      from: "earth",
      to: "metal",
    });
  });

  it("день можно перенести или убрать", async () => {
    await setMetalStart(manager, "2026-10-14", august);
    await setMetalStart(manager, "2026-10-21", august);
    expect((await getElementCalendarForStaff(manager, august)).metalStartsOn).toBe("2026-10-21");
    await setMetalStart(manager, null, august);
    expect((await getElementCalendarForStaff(manager, august)).metalStartsOn).toBeNull();
  });

  it("день не осенью или другого года не сохраняется", async () => {
    await expect(setMetalStart(manager, "2026-08-25", august)).rejects.toThrow("со 2 сентября по 30 ноября");
    await expect(setMetalStart(manager, "2027-10-14", august)).rejects.toThrow("2026 года");
  });

  it("в декабре день задаётся уже для следующей осени", async () => {
    const december = new Date("2026-12-10T12:00:00+03:00");
    await setMetalStart(manager, "2027-10-12", december);
    expect((await getElementCalendarForStaff(manager, december)).metalYear).toBe(2027);
  });

  it("обычный человек день задать не может", async () => {
    await expect(setMetalStart(anna, "2026-10-14", august)).rejects.toThrow("Доступно только сотрудникам");
  });
});
