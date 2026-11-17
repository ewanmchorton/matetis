import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { db, navigatorRead, practiceMark, programStart } from "@/shared/db";

import { clearDatabase, createPerson } from "../../../../tests/people";
import { getCompanionStages, getMyCompanion, markMyCompanionSeen } from "./companion.server";
import { savePractice } from "./program-content.server";

// Металл 2026 без заданной даты: с 1 по 30 ноября – 30 дней.
const now = new Date("2026-11-10T12:00:00+03:00");

let anna: string;
let smile: string;

async function mark(...days: string[]) {
  await db.insert(practiceMark).values(days.map((day) => ({ userId: anna, practiceId: smile, day })));
}

beforeEach(async () => {
  await clearDatabase();
  const manager = await createPerson("Мария", "content_manager");
  anna = await createPerson("Анна");
  smile = (await savePractice(manager, { title: "Улыбка", frequency: "daily", daypart: "morning", position: 1 })).id;
});

describe("Спутник", () => {
  it("кто не начинал программу – в первом состоянии и без экранов", async () => {
    expect((await getCompanionStages([anna], now)).get(anna)).toBe(1);
    expect(await getMyCompanion(anna, now)).toEqual({ stage: 1, screen: null });
  });

  it("растёт по дням с практикой и показывает превращение один раз", async () => {
    await db.insert(programStart).values({ userId: anna, startedOn: "2026-11-01" });
    // 1 ноября – неделя из одного дня, 2–6 ноября – полная неделя, 9–10 ноября – 2 дня из 5.
    await mark("2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-09");
    await db.insert(navigatorRead).values({ userId: anna, day: "2026-11-10" });

    expect(await getMyCompanion(anna, now)).toEqual({ stage: 3, screen: { kind: "transition", from: 1, to: 3 } });
    await markMyCompanionSeen(anna, now);
    expect(await getMyCompanion(anna, now)).toEqual({ stage: 3, screen: null });
  });

  it("снятые отметки уменьшают состояние, но экран не повторяется", async () => {
    await db.insert(programStart).values({ userId: anna, startedOn: "2026-11-01" });
    await mark("2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06");
    await markMyCompanionSeen(anna, now);
    await db.delete(practiceMark).where(eq(practiceMark.userId, anna));
    expect(await getMyCompanion(anna, now)).toEqual({ stage: 1, screen: null });

    await mark("2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06");
    expect((await getMyCompanion(anna, now)).screen).toBeNull();
  });

  it("кто был в программе в прошлой стихии – сначала экран новой стихии", async () => {
    await db.insert(programStart).values({ userId: anna, startedOn: "2026-10-01" });
    await mark("2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-09", "2026-11-10");

    expect((await getMyCompanion(anna, now)).screen).toEqual({ kind: "new-period", elementId: "metal" });
    await markMyCompanionSeen(anna, now);
    expect((await getMyCompanion(anna, now)).screen).toEqual({ kind: "transition", from: 1, to: 2 });
  });

  it("отметки прошлой стихии в новой не считаются", async () => {
    await db.insert(programStart).values({ userId: anna, startedOn: "2026-10-01" });
    await mark("2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31");
    expect((await getMyCompanion(anna, now)).stage).toBe(1);
  });
});
