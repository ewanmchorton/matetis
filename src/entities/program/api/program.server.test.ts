import { beforeEach, describe, expect, it } from "vitest";

import { updateMySettings } from "@/entities/person-settings/server";
import { saveMyTypeTest } from "@/entities/type-test-attempt/server";

import { clearDatabase, createPerson } from "../../../../tests/people";
import {
  getMyNavigator,
  getMyNote,
  getMyProgram,
  markNavigatorRead,
  markWelcomeVideoSeen,
  saveMyNote,
  setPracticeDone,
} from "./my-program.server";
import {
  listPracticesForStaff,
  listProgramVideosForStaff,
  saveNavigatorMessage,
  savePractice,
  saveProgramVideo,
} from "./program-content.server";

const HEALER = "t1";
const IDEALIST = "t2";
/** Пятница, 25 декабря 2026, полдень по Минску — первый день человека в программе. */
const start = new Date("2026-12-25T12:00:00+03:00");
const DAY_MS = 24 * 60 * 60 * 1000;
const day = (programDay: number) => new Date(start.getTime() + (programDay - 1) * DAY_MS);

let manager: string;
let anna: string;

const part = (n: number, tasks: [string | null, string | null] = [null, null]) => ({
  title: `Заголовок ${n}`,
  body: `Текст ${n}`,
  firstDayTask: tasks[0],
  secondDayTask: tasks[1],
});

async function addMessage(masterName: string, position: number, typeIds = [HEALER]) {
  return saveNavigatorMessage(manager, {
    masterName,
    position,
    typeIds,
    parts: [part(1, [`${masterName}: задание 1`, `${masterName}: задание 2`]), part(2), part(3)],
  });
}

beforeEach(async () => {
  await clearDatabase();
  manager = await createPerson("Мария", "content_manager");
  anna = await createPerson("Анна");
  await saveMyTypeTest(anna, { group1: "В", group2: "1" });
});

describe("Наполнение программы", () => {
  it("контент-менеджер добавляет ежедневную практику утром или вечером и еженедельную", async () => {
    await savePractice(manager, { title: "Улыбка", frequency: "daily", daypart: "morning", position: 2 });
    await savePractice(manager, { title: "Полный цикл зарядки", frequency: "weekly", position: 1 });
    const titles = (await listPracticesForStaff(manager)).map((item) => item.title);
    expect(titles).toEqual(["Улыбка", "Полный цикл зарядки"]);
  });

  it("у ежедневной практики нужно выбрать утро или вечер", async () => {
    await expect(savePractice(manager, { title: "Улыбка", frequency: "daily" })).rejects.toThrow("утро или вечер");
  });

  it("обычный человек практики не добавляет", async () => {
    await expect(savePractice(anna, { title: "Улыбка", frequency: "weekly" })).rejects.toThrow("только сотрудникам");
  });

  it("послание — три части, задания первой части и хотя бы один тип обязательны", async () => {
    await expect(
      saveNavigatorMessage(manager, { masterName: "Сурия", typeIds: [HEALER], parts: [part(1), part(2), part(3)] }),
    ).rejects.toThrow("оба задания первой части");
    await expect(
      saveNavigatorMessage(manager, { masterName: "Сурия", parts: [part(1, ["а", "б"]), part(2), part(3)] }),
    ).rejects.toThrow("каким типам");
    await expect(
      saveNavigatorMessage(manager, { masterName: "Сурия", typeIds: [HEALER], parts: [part(1, ["а", "б"])] }),
    ).rejects.toThrow("три части");
  });
});

describe("Программа человека", () => {
  beforeEach(async () => {
    await savePractice(manager, { title: "Улыбка", frequency: "daily", daypart: "morning", position: 1 });
    await savePractice(manager, { title: "Целительные звуки", frequency: "daily", daypart: "evening", position: 1, opensOnDay: 4 });
    await savePractice(manager, { title: "Полный цикл зарядки", frequency: "weekly", position: 1 });
  });

  it("в первый день — первый день программы, практики с 4-го дня ещё нет", async () => {
    const program = await getMyProgram(anna, day(1));
    expect(program.programDay).toBe(1);
    expect(program.morning.map((item) => item.title)).toEqual(["Улыбка"]);
    expect(program.evening).toEqual([]);
  });

  it("на 4-й день появляются целительные звуки", async () => {
    await getMyProgram(anna, day(1));
    const program = await getMyProgram(anna, day(4));
    expect(program.programDay).toBe(4);
    expect(program.evening.map((item) => item.title)).toEqual(["Целительные звуки"]);
  });

  it("закрытую практику отметить нельзя", async () => {
    await getMyProgram(anna, day(1));
    const [, sounds] = await listPracticesForStaff(manager);
    await expect(setPracticeDone(anna, sounds.id, true, day(1))).rejects.toThrow("не найдена");
  });

  it("отметка ежедневной практики — на сегодня, назавтра практика снова не отмечена", async () => {
    const program = await getMyProgram(anna, day(1));
    const smile = program.morning[0];
    await setPracticeDone(anna, smile.id, true, day(1));
    expect((await getMyProgram(anna, day(1))).morning[0].doneOn).toBe("2026-12-25");
    expect((await getMyProgram(anna, day(2))).morning[0].doneOn).toBeNull();
  });

  it("еженедельная практика отмечается один раз за неделю", async () => {
    const monday = new Date("2026-12-28T10:00:00+03:00");
    const wednesday = new Date("2026-12-30T10:00:00+03:00");
    const { weekly } = await getMyProgram(anna, monday);
    await setPracticeDone(anna, weekly[0].id, true, monday);
    await setPracticeDone(anna, weekly[0].id, true, wednesday);
    expect((await getMyProgram(anna, wednesday)).weekly[0].doneOn).toBe("2026-12-28");
    // Новая неделя — снова не отмечена.
    expect((await getMyProgram(anna, new Date("2027-01-04T10:00:00+03:00"))).weekly[0].doneOn).toBeNull();
  });

  it("отметку можно снять", async () => {
    const smile = (await getMyProgram(anna, day(1))).morning[0];
    await setPracticeDone(anna, smile.id, true, day(1));
    await setPracticeDone(anna, smile.id, false, day(1));
    expect((await getMyProgram(anna, day(1))).morning[0].doneOn).toBeNull();
  });

  it("буква дня заполняется после первой выполненной практики", async () => {
    const program = await getMyProgram(anna, day(1));
    expect(program.week.find((item) => item.day === "2026-12-25")?.done).toBe(false);
    await setPracticeDone(anna, program.morning[0].id, true, day(1));
    const week = (await getMyProgram(anna, day(1))).week;
    expect(week.map((item) => item.day)).toEqual([
      "2026-12-21",
      "2026-12-22",
      "2026-12-23",
      "2026-12-24",
      "2026-12-25",
      "2026-12-26",
      "2026-12-27",
    ]);
    expect(week.find((item) => item.day === "2026-12-25")?.done).toBe(true);
  });

  it("«сегодня» считается по часам телефона человека", async () => {
    // 20:00 UTC 25 декабря: в Минске ещё 25-е, во Владивостоке уже 26-е.
    const evening = new Date("2026-12-25T20:00:00Z");
    expect((await getMyProgram(anna, evening)).today).toBe("2026-12-25");
    await updateMySettings(anna, { timeZone: "Asia/Vladivostok" });
    const program = await getMyProgram(anna, evening);
    expect(program.today).toBe("2026-12-26");
    expect(program.programDay).toBe(2);
  });

  it("приветственное видео показывается, пока человек не нажал «Просмотрено»", async () => {
    expect((await getMyProgram(anna, day(1))).showWelcomeVideo).toBe(true);
    await markWelcomeVideoSeen(anna);
    expect((await getMyProgram(anna, day(2))).showWelcomeVideo).toBe(false);
  });
});

describe("Навигатор дня", () => {
  it("первый день — первая часть первого послания для типа человека", async () => {
    await addMessage("Сурия", 1);
    await getMyProgram(anna, day(1));
    const navigator = await getMyNavigator(anna, day(1));
    expect(navigator).toMatchObject({ masterName: "Сурия", cycleDay: 1, task: "Сурия: задание 1", newTask: false });
    expect(navigator?.parts.map((item) => item.title)).toEqual(["Заголовок 1"]);
  });

  it("второй день — тот же текст и новое задание, третий — вторая часть с заданием первого дня", async () => {
    await addMessage("Сурия", 1);
    await getMyProgram(anna, day(1));
    expect(await getMyNavigator(anna, day(2))).toMatchObject({ newTask: true, task: "Сурия: задание 2" });
    const third = await getMyNavigator(anna, day(3));
    expect(third).toMatchObject({ task: "Сурия: задание 1", newTask: false });
    expect(third?.parts.map((item) => item.title)).toEqual(["Заголовок 2"]);
  });

  it("седьмой день — послание полностью, восьмой — следующее послание", async () => {
    await addMessage("Сурия", 1);
    await addMessage("Эль Морья", 2);
    await getMyProgram(anna, day(1));
    const seventh = await getMyNavigator(anna, day(7));
    expect(seventh).toMatchObject({ fullMessage: true, masterName: "Сурия" });
    expect(seventh?.parts).toHaveLength(3);
    expect((await getMyNavigator(anna, day(8)))?.masterName).toBe("Эль Морья");
  });

  it("когда послания закончились — снова с первого", async () => {
    await addMessage("Сурия", 1);
    await addMessage("Эль Морья", 2);
    await getMyProgram(anna, day(1));
    expect((await getMyNavigator(anna, day(15)))?.masterName).toBe("Сурия");
  });

  it("послание для другого типа не показывается; одно послание может быть у нескольких типов", async () => {
    await addMessage("Только для Идеалиста", 1, [IDEALIST]);
    await getMyProgram(anna, day(1));
    expect(await getMyNavigator(anna, day(1))).toBeNull();
    await addMessage("Общее", 2, [HEALER, IDEALIST]);
    expect((await getMyNavigator(anna, day(1)))?.masterName).toBe("Общее");
  });

  it("без пройденного теста навигатора нет", async () => {
    await addMessage("Сурия", 1);
    const boris = await createPerson("Борис");
    expect((await getMyProgram(boris, day(1))).navigator).toBeNull();
  });

  it("«Прочитано» запоминается и заполняет букву дня", async () => {
    await addMessage("Сурия", 1);
    await getMyProgram(anna, day(1));
    await markNavigatorRead(anna, day(1));
    const program = await getMyProgram(anna, day(1));
    expect(program.navigator?.read).toBe(true);
    expect(program.week.find((item) => item.day === "2026-12-25")?.done).toBe(true);
  });
});

describe("Заметки для себя", () => {
  it("заметка сохраняется на сегодня, пустая — удаляется", async () => {
    const thinking = await savePractice(manager, { title: "Мышление по навигатору", frequency: "daily", daypart: "evening", position: 2 });
    await saveMyNote(anna, thinking.id, "  Семь раз поблагодарила  ", day(1));
    expect(await getMyNote(anna, thinking.id, day(1))).toEqual({ text: "Семь раз поблагодарила" });
    expect(await getMyNote(anna, thinking.id, day(2))).toEqual({ text: "" });
    await saveMyNote(anna, thinking.id, "", day(1));
    expect(await getMyNote(anna, thinking.id, day(1))).toEqual({ text: "" });
  });
});

describe("Видео библиотеки", () => {
  it("контент-менеджер сохраняет приветственное видео и видео по стихии, остальные пустые", async () => {
    await saveProgramVideo(manager, { slot: "welcome", videoUrl: "https://youtu.be/abc", body: "Как устроена программа" });
    await saveProgramVideo(manager, { slot: "earth", videoUrl: "https://www.youtube.com/watch?v=x", body: "" });
    const videos = await listProgramVideosForStaff(manager);
    expect(videos.map((video) => video.slot)).toEqual(["welcome", "water", "wood", "fire", "earth", "metal"]);
    expect(videos[0]).toEqual({ slot: "welcome", videoUrl: "https://youtu.be/abc", body: "Как устроена программа" });
    expect(videos[1].videoUrl).toBeNull();
  });

  it("видео — только ссылка на YouTube", async () => {
    await expect(saveProgramVideo(manager, { slot: "welcome", videoUrl: "https://vimeo.com/1" })).rejects.toThrow("YouTube");
  });
});
