import { beforeEach, describe, expect, it } from "vitest";

import { getStudentForAdmin } from "@/entities/student/server";
import { saveMyTypeTest } from "@/entities/type-test-attempt/server";
import { accessSettings, db } from "@/shared/db";

import { clearDatabase, createPerson } from "../../../../tests/people";
import {
  addMonths,
  closeAccess,
  extendAccess,
  getAccessCardForAdmin,
  getAccessSettingsForAdmin,
  getMyAccess,
  hasAccess,
  listAccessForAdmin,
  statusFromPeriods,
  updateAccessSettings,
} from "./access.server";

const DAY = 24 * 60 * 60 * 1000;
const jan10 = new Date("2026-01-10T12:00:00Z");
const later = (from: Date, days: number) => new Date(from.getTime() + days * DAY);

let admin: string;
let manager: string;

beforeEach(async () => {
  await clearDatabase();
  await db
    .update(accessSettings)
    .set({ adminPhone: "+375293344101", firstMonthCents: 2000, monthCents: 500, threeMonthsCents: 1000 });
  admin = await createPerson("Татьяна Валерьевна", "admin");
  manager = await createPerson("Контент", "content_manager");
});

const anna = { email: "anna@example.ru" };

async function registerAnna() {
  const id = await createPerson("Анна", "user", anna.email);
  return { id, email: anna.email, role: "user" };
}

describe("Доступ по почте", () => {
  it("почта, добавленная заранее, после регистрации даёт доступ", async () => {
    await extendAccess(admin, anna.email, { months: 1 }, jan10);
    const person = await registerAnna();
    expect(await hasAccess(person, later(jan10, 1))).toBe(true);
  });

  it("прошёл тест без записей о доступе — статус «заявка», доступа нет", async () => {
    const person = await registerAnna();
    await saveMyTypeTest(person.id, { group1: "А", group2: "2" });
    expect((await getMyAccess(person)).status.kind).toBe("request");
    expect(await hasAccess(person)).toBe(false);
  });

  it("почта с заглавными буквами и пробелами находит ту же запись", async () => {
    await extendAccess(admin, "  Anna@Example.RU ", { months: 1 }, jan10);
    const card = await getAccessCardForAdmin(admin, "anna@example.ru", jan10);
    expect(card.periods).toHaveLength(1);
    expect(card.email).toBe("anna@example.ru");
  });

  it("неверная почта не сохраняется", async () => {
    await expect(extendAccess(admin, "anna@", { months: 1 })).rejects.toThrow("Проверьте почту");
  });

  it("администратор и контент-менеджер пользуются приложением без подписки", async () => {
    expect(await hasAccess({ id: admin, email: "a@test.local", role: "admin" })).toBe(true);
    expect(await hasAccess({ id: manager, email: "m@test.local", role: "content_manager" })).toBe(true);
  });

  it("свой статус приходит вместе с телефоном администратора", async () => {
    const person = await registerAnna();
    expect((await getMyAccess(person)).adminPhone).toBe("+375293344101");
  });
});

describe("Продление", () => {
  it("идущий доступ продлевается с даты окончания", async () => {
    await extendAccess(admin, anna.email, { months: 1 }, jan10);
    const card = await extendAccess(admin, anna.email, { months: 1 }, later(jan10, 20));
    expect(card.status).toMatchObject({ kind: "active", until: new Date("2026-03-10T12:00:00Z") });
  });

  it("закончившийся доступ продлевается с текущего момента", async () => {
    await extendAccess(admin, anna.email, { months: 1 }, jan10);
    const now = new Date("2026-03-01T09:00:00Z");
    const card = await extendAccess(admin, anna.email, { months: 1 }, now);
    expect(card.periods[0]).toMatchObject({ startsAt: now, endsAt: new Date("2026-04-01T09:00:00Z") });
  });

  it("«до даты» заканчивается в указанный день и не раньше текущего окончания", async () => {
    await extendAccess(admin, anna.email, { months: 1 }, jan10);
    await expect(
      extendAccess(admin, anna.email, { until: "2026-02-01T00:00:00Z", amountCents: 0 }, jan10),
    ).rejects.toThrow("Дата окончания должна быть позже");
    const card = await extendAccess(admin, anna.email, { until: "2026-06-01T00:00:00Z", amountCents: 2500 }, jan10);
    expect(card.status).toMatchObject({ kind: "active", until: new Date("2026-06-01T00:00:00Z") });
  });

  it("31 января + 1 месяц — последний день февраля", () => {
    expect(addMonths(new Date("2026-01-31T10:00:00Z"), 1)).toEqual(new Date("2026-02-28T10:00:00Z"));
  });

  it("неизвестный срок не принимается", async () => {
    await expect(extendAccess(admin, anna.email, { months: 2 })).rejects.toThrow("Выберите срок");
  });
});

describe("Суммы", () => {
  it("первый месяц — 20 €, дальше месяц — 5 €, три месяца — 10 €", async () => {
    let card = await getAccessCardForAdmin(admin, anna.email, jan10);
    expect(card.suggestedAmounts).toEqual({ 1: 2000, 3: null, 12: null });
    await extendAccess(admin, anna.email, { months: 1 }, jan10);
    card = await getAccessCardForAdmin(admin, anna.email, jan10);
    expect(card.suggestedAmounts).toEqual({ 1: 500, 3: 1000, 12: null });
    await extendAccess(admin, anna.email, { months: 1 }, jan10);
    card = await extendAccess(admin, anna.email, { months: 3 }, jan10);
    expect(card.periods.map((period) => period.amountCents)).toEqual([1000, 500, 2000]);
  });

  it("поправленная сумма сохраняется", async () => {
    const card = await extendAccess(admin, anna.email, { months: 1, amountCents: 1500 }, jan10);
    expect(card.periods[0].amountCents).toBe(1500);
  });

  it("без цены (12 месяцев) нужно указать сумму", async () => {
    await expect(extendAccess(admin, anna.email, { months: 12 }, jan10)).rejects.toThrow("Укажите сумму");
  });

  it("цены из настроек меняет администратор, новые суммы подставляются сразу", async () => {
    await updateAccessSettings(admin, { firstMonthCents: 3000 });
    expect((await getAccessCardForAdmin(admin, anna.email)).suggestedAmounts[1]).toBe(3000);
    expect((await getAccessSettingsForAdmin(admin)).monthCents).toBe(500);
  });

  it("телефон в настройках сохраняется без пробелов и дефисов", async () => {
    const settings = await updateAccessSettings(admin, { adminPhone: "+375 29 111-22-33" });
    expect(settings.adminPhone).toBe("+375291112233");
    await expect(updateAccessSettings(admin, { adminPhone: "позвонить" })).rejects.toThrow("Телефон");
  });
});

describe("Статусы на границах", () => {
  const until = new Date("2026-02-10T12:00:00Z");
  const periods = [{ startsAt: jan10, endsAt: until }];

  it("ровно за 3 дня — «закончится через 3 дня»", () => {
    expect(statusFromPeriods(periods, later(until, -3))).toMatchObject({ kind: "active", daysLeft: 3, expiring: true });
  });

  it("за 3 дня и минуту — ещё обычный доступ", () => {
    const now = new Date(until.getTime() - 3 * DAY - 60_000);
    expect(statusFromPeriods(periods, now)).toMatchObject({ kind: "active", expiring: false });
  });

  it("в день окончания до нужного часа доступ ещё есть", () => {
    expect(statusFromPeriods(periods, new Date(until.getTime() - 60_000))).toMatchObject({ kind: "active", daysLeft: 1 });
  });

  it("в момент окончания и на следующий день — «закончился»", () => {
    expect(statusFromPeriods(periods, until)).toEqual({ kind: "expired", endedAt: until });
    expect(statusFromPeriods(periods, later(until, 1))).toEqual({ kind: "expired", endedAt: until });
  });
});

describe("Закрытие доступа", () => {
  it("доступ прекращается сразу, история остаётся", async () => {
    await extendAccess(admin, anna.email, { months: 1 }, jan10);
    await extendAccess(admin, anna.email, { months: 1 }, jan10);
    const now = later(jan10, 5);
    const card = await closeAccess(admin, anna.email, now);
    expect(card.status.kind).toBe("expired");
    expect(card.periods).toHaveLength(2);
    expect(await hasAccess({ ...(await registerAnna()) }, now)).toBe(false);
  });
});

describe("Список «Доступы»", () => {
  it("показывает зарегистрированных и добавленных заранее, заявки сверху; сотрудников нет", async () => {
    const person = await registerAnna();
    await saveMyTypeTest(person.id, { group1: "А", group2: "2" });
    await extendAccess(admin, "boris@example.ru", { months: 1 });
    const list = await listAccessForAdmin(admin);
    expect(list.map((item) => [item.email, item.name, item.status.kind])).toEqual([
      ["anna@example.ru", "Анна", "request"],
      ["boris@example.ru", null, "active"],
    ]);
  });

  it("поиск по части почты или имени", async () => {
    await registerAnna();
    await extendAccess(admin, "boris@example.ru", { months: 1 });
    expect((await listAccessForAdmin(admin, "анн")).map((item) => item.email)).toEqual(["anna@example.ru"]);
    expect((await listAccessForAdmin(admin, "BORIS")).map((item) => item.email)).toEqual(["boris@example.ru"]);
  });
});

describe("Роли", () => {
  it("контент-менеджер не видит доступы, настройки и учеников", async () => {
    const message = "Доступно только администратору";
    await expect(listAccessForAdmin(manager)).rejects.toThrow(message);
    await expect(getAccessCardForAdmin(manager, anna.email)).rejects.toThrow(message);
    await expect(extendAccess(manager, anna.email, { months: 1 })).rejects.toThrow(message);
    await expect(closeAccess(manager, anna.email)).rejects.toThrow(message);
    await expect(getAccessSettingsForAdmin(manager)).rejects.toThrow(message);
    await expect(getStudentForAdmin(manager, admin)).rejects.toThrow(message);
  });

  it("обычный человек не может открыть доступ сам себе", async () => {
    const person = await registerAnna();
    await expect(extendAccess(person.id, anna.email, { months: 1 })).rejects.toThrow("Доступно только администратору");
  });
});
