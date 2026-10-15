import { beforeEach, describe, expect, it } from "vitest";

import { clearDatabase, createPerson } from "../../../../tests/people";
import { getMySettings, updateMySettings } from "./person-settings.server";

let anna: string;
let boris: string;

beforeEach(async () => {
  await clearDatabase();
  anna = await createPerson("Анна");
  boris = await createPerson("Борис");
});

describe("Настройки человека", () => {
  it("у нового человека публикация событий включена, а согласия на автоподбор нет", async () => {
    expect(await getMySettings(anna)).toEqual({ publishEvents: true, autoMatchConsent: false });
  });

  it("человек может выключить публикацию событий", async () => {
    await updateMySettings(anna, { publishEvents: false });
    expect((await getMySettings(anna)).publishEvents).toBe(false);
  });

  it("человек может дать и забрать согласие на автоподбор", async () => {
    await updateMySettings(anna, { autoMatchConsent: true });
    expect((await getMySettings(anna)).autoMatchConsent).toBe(true);
    await updateMySettings(anna, { autoMatchConsent: false });
    expect((await getMySettings(anna)).autoMatchConsent).toBe(false);
  });

  it("изменение одной настройки не сбрасывает другую", async () => {
    await updateMySettings(anna, { autoMatchConsent: true });
    await updateMySettings(anna, { publishEvents: false });
    expect(await getMySettings(anna)).toEqual({ publishEvents: false, autoMatchConsent: true });
  });

  it("настройки одного человека не меняют настройки другого", async () => {
    await updateMySettings(anna, { publishEvents: false, autoMatchConsent: true });
    expect(await getMySettings(boris)).toEqual({ publishEvents: true, autoMatchConsent: false });
  });
});
