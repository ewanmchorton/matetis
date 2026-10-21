import { beforeEach, describe, expect, it } from "vitest";

import { saveMyBirthDate } from "@/entities/birth-reading/server";
import { saveMyTypeTest } from "@/entities/type-test-attempt/server";
import { db, typeTestAttempt } from "@/shared/db";

import { clearDatabase, createPerson } from "../../../../tests/people";
import { getStudentForAdmin, listStudentsForAdmin } from "./student.server";

let anna: string;
let boris: string;
let admin: string;

beforeEach(async () => {
  await clearDatabase();
  anna = await createPerson("Анна");
  boris = await createPerson("Борис");
  admin = await createPerson("Жанна", "admin");
});

describe("Ученики в админке", () => {
  it("в списке все люди, кроме администраторов", async () => {
    const names = (await listStudentsForAdmin(admin)).map((student) => student.name).sort();
    expect(names).toEqual(["Анна", "Борис"]);
  });

  it("в списке виден текущий тип и указана ли дата рождения", async () => {
    await saveMyTypeTest(anna, { group1: "А", group2: "2" });
    await db.insert(typeTestAttempt).values({ userId: anna, group1Code: "С", group2Code: "4" });
    await saveMyBirthDate(anna, "1988-03-15");
    const students = await listStudentsForAdmin(admin);
    expect(students.find((student) => student.id === anna)).toMatchObject({
      typeName: "Прагматик",
      hasBirthDate: true,
    });
    expect(students.find((student) => student.id === boris)).toMatchObject({ typeName: null, hasBirthDate: false });
  });

  it("администратор открывает карточку человека", async () => {
    expect(await getStudentForAdmin(admin, anna)).toMatchObject({ id: anna, name: "Анна" });
  });

  it("обычный человек не видит список и чужие карточки", async () => {
    await expect(listStudentsForAdmin(anna)).rejects.toThrow("Доступно только администратору");
    await expect(getStudentForAdmin(anna, boris)).rejects.toThrow("Доступно только администратору");
  });
});
