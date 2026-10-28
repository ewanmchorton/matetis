import { beforeEach, describe, expect, it } from "vitest";

import { clearDatabase, createPerson } from "../../../../tests/people";
import { getMySettings, updateMySettings } from "./person-settings.server";

const phraseDefaults = { phraseNotifications: true, phraseFromHour: 9, phraseToHour: 21 };

let anna: string;
let boris: string;

beforeEach(async () => {
  await clearDatabase();
  anna = await createPerson("Анна");
  boris = await createPerson("Борис");
});

describe("Настройки человека", () => {
  it("у нового человека включены публикация событий, автоподбор и фраза дня с 9 до 21", async () => {
    expect(await getMySettings(anna)).toEqual({ publishEvents: true, autoMatchConsent: true, ...phraseDefaults });
  });

  it("человек может выключить публикацию событий", async () => {
    await updateMySettings(anna, { publishEvents: false });
    expect((await getMySettings(anna)).publishEvents).toBe(false);
  });

  it("человек может отказаться от автоподбора и снова его включить", async () => {
    await updateMySettings(anna, { autoMatchConsent: false });
    expect((await getMySettings(anna)).autoMatchConsent).toBe(false);
    await updateMySettings(anna, { autoMatchConsent: true });
    expect((await getMySettings(anna)).autoMatchConsent).toBe(true);
  });

  it("изменение одной настройки не сбрасывает другую", async () => {
    await updateMySettings(anna, { autoMatchConsent: false });
    await updateMySettings(anna, { publishEvents: false });
    expect(await getMySettings(anna)).toEqual({ publishEvents: false, autoMatchConsent: false, ...phraseDefaults });
  });

  it("настройки одного человека не меняют настройки другого", async () => {
    await updateMySettings(anna, { publishEvents: false, autoMatchConsent: false });
    expect(await getMySettings(boris)).toEqual({ publishEvents: true, autoMatchConsent: true, ...phraseDefaults });
  });

  it("человек может отказаться от фразы дня", async () => {
    await updateMySettings(anna, { phraseNotifications: false });
    expect((await getMySettings(anna)).phraseNotifications).toBe(false);
  });

  it("человек выбирает промежуток для фразы дня", async () => {
    await updateMySettings(anna, { phraseFromHour: 10, phraseToHour: 18 });
    const settings = await getMySettings(anna);
    expect([settings.phraseFromHour, settings.phraseToHour]).toEqual([10, 18]);
  });

  it("время «до» не может быть раньше или равно времени «с»", async () => {
    await expect(updateMySettings(anna, { phraseFromHour: 21 })).rejects.toThrow("Время «до» должно быть позже");
    await expect(updateMySettings(anna, { phraseFromHour: 15, phraseToHour: 12 })).rejects.toThrow();
    expect((await getMySettings(anna)).phraseFromHour).toBe(9);
  });

  it("неизвестный часовой пояс не сохраняется и не ломает остальные настройки", async () => {
    await updateMySettings(anna, { timeZone: "Луна/Кратер", phraseNotifications: false });
    expect((await getMySettings(anna)).phraseNotifications).toBe(false);
  });
});
