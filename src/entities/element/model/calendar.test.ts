import { describe, expect, it } from "vitest";

import { backgroundAt, elementAt, isMetalDateAllowed, minskMidnight } from "./calendar";

const at = (iso: string) => new Date(iso);
const metal2026 = minskMidnight(2026, 10, 14);
const withMetal = (year: number) => (year === 2026 ? metal2026 : null);
const noMetal = () => null;

describe("Календарь стихий", () => {
  it("зима — Вода, весна — Дерево, лето — Огонь", () => {
    expect(elementAt(at("2026-12-01T00:00:00+03:00"), null)).toBe("water");
    expect(elementAt(at("2027-02-28T23:59:00+03:00"), null)).toBe("water");
    expect(elementAt(at("2027-03-01T00:00:00+03:00"), null)).toBe("wood");
    expect(elementAt(at("2027-05-31T12:00:00+03:00"), null)).toBe("wood");
    expect(elementAt(at("2027-06-01T00:00:00+03:00"), null)).toBe("fire");
    expect(elementAt(at("2027-08-31T23:00:00+03:00"), null)).toBe("fire");
  });

  it("осень начинается Землёй и остаётся ей, пока не задана дата Металла", () => {
    expect(elementAt(at("2026-09-01T00:00:00+03:00"), null)).toBe("earth");
    expect(elementAt(at("2026-11-30T23:00:00+03:00"), null)).toBe("earth");
  });

  it("с заданной даты — Металл до конца ноября, с декабря — Вода", () => {
    expect(elementAt(at("2026-10-13T23:59:00+03:00"), metal2026)).toBe("earth");
    expect(elementAt(at("2026-10-14T00:00:00+03:00"), metal2026)).toBe("metal");
    expect(elementAt(at("2026-11-30T23:00:00+03:00"), metal2026)).toBe("metal");
    expect(elementAt(at("2026-12-01T00:00:00+03:00"), metal2026)).toBe("water");
  });

  it("смена сезона считается по Минску: 31 мая 22:00 UTC — уже лето", () => {
    expect(elementAt(at("2027-05-31T22:00:00Z"), null)).toBe("fire");
  });

  it("дату Металла можно задать только осенью, после 1 сентября", () => {
    expect(isMetalDateAllowed(10, 14)).toBe(true);
    expect(isMetalDateAllowed(9, 1)).toBe(false);
    expect(isMetalDateAllowed(12, 1)).toBe(false);
  });
});

describe("Фоны стихий и переходов", () => {
  it("в середине стихии — фон стихии", () => {
    expect(backgroundAt(at("2027-01-15T12:00:00+03:00"), noMetal)).toEqual({ kind: "element", elementId: "water" });
  });

  it("за 5 дней до смены стихии и 5 дней после — фон перехода", () => {
    const winterToSpring = { kind: "transition", from: "water", to: "wood" };
    expect(backgroundAt(at("2027-02-23T23:59:00+03:00"), noMetal)).toEqual({ kind: "element", elementId: "water" });
    expect(backgroundAt(at("2027-02-24T00:00:00+03:00"), noMetal)).toEqual(winterToSpring);
    expect(backgroundAt(at("2027-03-05T23:59:00+03:00"), noMetal)).toEqual(winterToSpring);
    expect(backgroundAt(at("2027-03-06T00:00:00+03:00"), noMetal)).toEqual({ kind: "element", elementId: "wood" });
  });

  it("переход Земля → Металл — вокруг заданной даты", () => {
    expect(backgroundAt(at("2026-10-10T12:00:00+03:00"), withMetal)).toEqual({ kind: "transition", from: "earth", to: "metal" });
    expect(backgroundAt(at("2026-10-18T12:00:00+03:00"), withMetal)).toEqual({ kind: "transition", from: "earth", to: "metal" });
    expect(backgroundAt(at("2026-10-25T12:00:00+03:00"), withMetal)).toEqual({ kind: "element", elementId: "metal" });
  });

  it("пока дата Металла не задана, перехода Земля → Металл нет", () => {
    expect(backgroundAt(at("2026-10-14T12:00:00+03:00"), noMetal)).toEqual({ kind: "element", elementId: "earth" });
  });

  it("переход в зиму — с Металла, а если дату Металла не задали — с Земли", () => {
    const lateNovember = at("2026-11-28T12:00:00+03:00");
    expect(backgroundAt(lateNovember, withMetal)).toEqual({ kind: "transition", from: "metal", to: "water" });
    expect(backgroundAt(lateNovember, noMetal)).toEqual({ kind: "transition", from: "earth", to: "water" });
  });

  it("в начале декабря ещё переход Металл → Вода", () => {
    expect(backgroundAt(at("2026-12-03T12:00:00+03:00"), withMetal)).toEqual({ kind: "transition", from: "metal", to: "water" });
  });
});
