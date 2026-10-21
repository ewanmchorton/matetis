import { beforeEach, describe, expect, it } from "vitest";

import { getPersonTypes } from "@/entities/person-type";
import { db, typeTestAttempt } from "@/shared/db";
import { getTypeTest } from "@/entities/type-test";

import { clearDatabase, createPerson } from "../../../../tests/people";
import { getMyCurrentType, getTypeTestHistoryForAdmin, saveMyTypeTest } from "./type-test-attempt.server";

let anna: string;
let boris: string;
let admin: string;

beforeEach(async () => {
  await clearDatabase();
  anna = await createPerson("Анна");
  boris = await createPerson("Борис");
  admin = await createPerson("Жанна", "admin");
});

describe("Прохождение теста на тип", () => {
  it("пока тест не пройден, типа нет", async () => {
    expect(await getMyCurrentType(anna)).toBeNull();
  });

  it("ответы А и 2 дают тип Радикал, он сохраняется", async () => {
    const result = await saveMyTypeTest(anna, { group1: "А", group2: "2" });
    expect(result.type.name).toBe("Радикал");
    expect((await getMyCurrentType(anna))?.name).toBe("Радикал");
  });

  it("каждое сочетание ответов теста даёт один из 12 типов", () => {
    const [group1, group2] = getTypeTest().groups;
    const codes = group1.sections.flatMap((a) => group2.sections.map((b) => a.code + b.code));
    expect(codes.sort()).toEqual(getPersonTypes().map((type) => type.code).sort());
  });

  it("повторный тест не принимается, тип остаётся прежним", async () => {
    await saveMyTypeTest(anna, { group1: "А", group2: "2" });
    await expect(saveMyTypeTest(anna, { group1: "С", group2: "4" })).rejects.toThrow(
      "Повторно пройти тест можно будет после окончания текущей стихии",
    );
    expect((await getMyCurrentType(anna))?.name).toBe("Радикал");
  });

  it("текущий тип — по последнему прохождению, прежние остаются в истории", async () => {
    // Второе прохождение — как будто после окончания стихии: записываем напрямую, пока нет календаря.
    await saveMyTypeTest(anna, { group1: "А", group2: "2" });
    await db.insert(typeTestAttempt).values({ userId: anna, group1Code: "С", group2Code: "4" });
    expect((await getMyCurrentType(anna))?.name).toBe("Прагматик");
    const history = await getTypeTestHistoryForAdmin(admin, anna);
    expect(history.map((attempt) => attempt.type.name)).toEqual(["Прагматик", "Радикал"]);
  });

  it.each([
    ["латинская A вместо русской А", { group1: "A", group2: "2" }],
    ["нет ответа во второй группе", { group1: "А" }],
    ["несуществующий вариант", { group1: "А", group2: "5" }],
  ])("%s — не сохраняется", async (_, answers) => {
    await expect(saveMyTypeTest(anna, answers)).rejects.toThrow("Выберите по одному описанию в каждой группе");
    expect(await getMyCurrentType(anna)).toBeNull();
  });

  it("тест одного человека не меняет тип другого", async () => {
    await saveMyTypeTest(anna, { group1: "А", group2: "2" });
    expect(await getMyCurrentType(boris)).toBeNull();
  });
});

describe("История тестов для администратора", () => {
  it("администратор видит пустую историю, если человек тест не проходил", async () => {
    expect(await getTypeTestHistoryForAdmin(admin, boris)).toEqual([]);
  });

  it("обычный человек не может открыть чужую историю", async () => {
    await saveMyTypeTest(anna, { group1: "А", group2: "2" });
    await expect(getTypeTestHistoryForAdmin(boris, anna)).rejects.toThrow("Доступно только администратору");
  });
});
