import { beforeEach, describe, expect, it } from "vitest";

import { clearDatabase, createPerson } from "../../../../tests/people";
import { getBirthReadingForAdmin, getMyBirthReading, saveMyBirthDate } from "./birth-reading.server";

let anna: string;
let boris: string;
let admin: string;

beforeEach(async () => {
  await clearDatabase();
  anna = await createPerson("Анна");
  boris = await createPerson("Борис");
  admin = await createPerson("Жанна", "admin");
});

describe("Расчёт по дате рождения в базе", () => {
  it("пока дата не указана, расчёта нет", async () => {
    expect(await getMyBirthReading(anna)).toBeNull();
  });

  it("дата сохраняется вместе со счётом цифр и стихиями", async () => {
    await saveMyBirthDate(anna, "1988-03-15");
    const reading = await getMyBirthReading(anna);
    expect(reading?.birthDate).toBe("1988-03-15");
    expect(reading?.digitCounts).toEqual({ 1: 2, 2: 0, 3: 4, 4: 0, 5: 2, 6: 1, 7: 0, 8: 3, 9: 1 });
    expect(reading?.elements.map(({ element, count }) => [element, count])).toEqual([
      ["earth", 5],
      ["metal", 1],
      ["water", 2],
      ["wood", 4],
      ["fire", 1],
    ]);
  });

  it("новая дата перезаписывает прежний расчёт", async () => {
    await saveMyBirthDate(anna, "1988-03-15");
    await saveMyBirthDate(anna, "2003-11-21");
    const reading = await getMyBirthReading(anna);
    expect(reading?.birthDate).toBe("2003-11-21");
    expect(reading?.digitCounts[1]).toBe(5);
  });

  it("неправильная дата не сохраняется", async () => {
    await expect(saveMyBirthDate(anna, "2001-02-30")).rejects.toThrow("Укажите настоящую дату рождения");
    await expect(saveMyBirthDate(anna, null)).rejects.toThrow("Укажите настоящую дату рождения");
    expect(await getMyBirthReading(anna)).toBeNull();
  });

  it("дата одного человека не меняет расчёт другого", async () => {
    await saveMyBirthDate(anna, "1988-03-15");
    await saveMyBirthDate(boris, "1990-07-05");
    expect((await getMyBirthReading(anna))?.birthDate).toBe("1988-03-15");
  });
});

describe("Доступ администратора", () => {
  it("администратор видит расчёт любого человека", async () => {
    await saveMyBirthDate(anna, "1988-03-15");
    const reading = await getBirthReadingForAdmin(admin, anna);
    expect(reading?.elements[0]).toEqual({ element: "earth", count: 5, level: "very_strong" });
  });

  it("администратор видит, что человек дату не указал", async () => {
    expect(await getBirthReadingForAdmin(admin, boris)).toBeNull();
  });

  it("обычный человек не может открыть чужой расчёт", async () => {
    await saveMyBirthDate(anna, "1988-03-15");
    await expect(getBirthReadingForAdmin(boris, anna)).rejects.toThrow("Доступно только администратору");
  });
});
