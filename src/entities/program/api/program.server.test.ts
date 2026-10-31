import { beforeEach, describe, expect, it } from "vitest";

import { saveMyBirthDate } from "@/entities/birth-reading/server";
import { updateMySettings } from "@/entities/person-settings/server";
import { saveMyTypeTest } from "@/entities/type-test-attempt/server";

import { clearDatabase, createPerson } from "../../../../tests/people";
import {
  getMyNavigator,
  getMyNote,
  getMyProgram,
  markElementVideoSeen,
  markNavigatorRead,
  markWelcomeVideoSeen,
  saveMyNote,
  setPracticeDone,
} from "./my-program.server";
import {
  listPracticesForStaff,
  listProgramVideosForStaff,
  saveElderMessage,
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
    parts: [part(1, [`${masterName}: задание 1`, `${masterName}: задание 2`]), part(2)],
  });
}

async function addElders(title: string, position: number, typeIds = [HEALER]) {
  return saveElderMessage(manager, { title, body: `${title}: текст`, position, typeIds });
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

  it("послание — две части, задания первой части и хотя бы один тип обязательны", async () => {
    await expect(
      saveNavigatorMessage(manager, { masterName: "Сурия", typeIds: [HEALER], parts: [part(1), part(2)] }),
    ).rejects.toThrow("оба задания первой части");
    await expect(
      saveNavigatorMessage(manager, { masterName: "Сурия", parts: [part(1, ["а", "б"]), part(2)] }),
    ).rejects.toThrow("каким типам");
    await expect(
      saveNavigatorMessage(manager, { masterName: "Сурия", typeIds: [HEALER], parts: [part(1, ["а", "б"]), part(2), part(3)] }),
    ).rejects.toThrow("две части");
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

  it("в программе — имя, тип и текст практики, список слабых стихий человеку не отдаётся", async () => {
    await saveMyBirthDate(anna, "1988-03-15");
    const program = await getMyProgram(anna, day(1));
    expect(program.person).toEqual({ name: "Анна", typeName: expect.any(String) });
    expect(program.morning[0]).toMatchObject({ title: "Улыбка", body: "", videoUrl: null });
  });

  it("видео по стихии — пока не посмотрено в этот период; в следующую зиму снова не посмотрено", async () => {
    expect((await getMyProgram(anna, day(1))).elementVideo).toBeNull();
    await saveProgramVideo(manager, { slot: "water", videoUrl: "https://youtu.be/water", body: "Про Воду" });
    expect((await getMyProgram(anna, day(1))).elementVideo).toEqual({
      videoUrl: "https://youtu.be/water",
      body: "Про Воду",
      seen: false,
    });
    await markElementVideoSeen(anna, day(1));
    // 25 декабря и 20 января — одна зима.
    expect((await getMyProgram(anna, new Date("2027-01-20T12:00:00+03:00"))).elementVideo?.seen).toBe(true);
    expect((await getMyProgram(anna, new Date("2027-12-20T12:00:00+03:00"))).elementVideo?.seen).toBe(false);
  });

  it("приветственное видео показывается, пока человек не нажал «Просмотрено»", async () => {
    expect((await getMyProgram(anna, day(1))).showWelcomeVideo).toBe(true);
    await markWelcomeVideoSeen(anna);
    expect((await getMyProgram(anna, day(2))).showWelcomeVideo).toBe(false);
  });
});

describe("Варианты практик", () => {
  const titles = (items: { title: string; variantId: string | null }[]) => items.map((item) => item.title);
  /** Текст варианта, который человек видит в программе. */
  async function shownBody(practiceTitle: string, variantId: string | null | undefined) {
    const item = (await listPracticesForStaff(manager)).find((entry) => entry.title === practiceTitle);
    return item?.variants.find((variant) => variant.id === variantId)?.body ?? null;
  }

  it("еженедельная практика своя у каждого типа; без подходящего варианта её нет", async () => {
    await savePractice(manager, {
      title: "Прогулка без телефона",
      frequency: "weekly",
      position: 1,
      variants: [
        { body: "Вопрос Целителю", typeIds: [HEALER] },
        { body: "Вопрос Идеалисту", typeIds: [IDEALIST] },
      ],
    });
    const walk = (await getMyProgram(anna, day(1))).weekly[0];
    expect(await shownBody("Прогулка без телефона", walk.variantId)).toBe("Вопрос Целителю");

    const boris = await createPerson("Борис");
    expect((await getMyProgram(boris, day(1))).weekly).toEqual([]);
  });

  it("«каждую неделю новый» — следующий вариант по порядку, потом по кругу", async () => {
    await savePractice(manager, {
      title: "Прогулка без телефона",
      frequency: "weekly",
      position: 1,
      newEachWeek: true,
      variants: [
        { body: "Вопрос 1", typeIds: [HEALER] },
        { body: "Вопрос для Идеалиста", typeIds: [IDEALIST] },
        { body: "Вопрос 2", typeIds: [HEALER] },
      ],
    });
    const bodies = [];
    for (const programDay of [1, 8, 15]) {
      bodies.push(await shownBody("Прогулка без телефона", (await getMyProgram(anna, day(programDay))).weekly[0].variantId));
    }
    expect(bodies).toEqual(["Вопрос 1", "Вопрос 2", "Вопрос 1"]);
  });

  it("с 15-го дня медитации чередуются по неделям, новая медитация — каждый раз, когда она есть", async () => {
    await savePractice(manager, {
      title: "Медитация на качество силы",
      frequency: "weekly",
      position: 1,
      newEachWeek: true,
      alternation: "first",
      variants: [
        { body: "Медитация 1", typeIds: [HEALER] },
        { body: "Медитация 2", typeIds: [HEALER] },
      ],
    });
    await savePractice(manager, {
      title: "Медитация на слабую стихию",
      frequency: "weekly",
      position: 2,
      opensOnDay: 8,
      alternation: "second",
    });
    const weeks = [];
    for (const programDay of [1, 8, 15, 22, 29]) {
      const { weekly } = await getMyProgram(anna, day(programDay));
      weeks.push(
        await Promise.all(
          weekly.map(async (item) => (await shownBody(item.title, item.variantId)) ?? item.title),
        ),
      );
    }
    expect(weeks).toEqual([
      ["Медитация 1"],
      ["Медитация 2", "Медитация на слабую стихию"],
      ["Медитация 1"],
      ["Медитация на слабую стихию"],
      ["Медитация 2"],
    ]);
  });

  it("практику, которой нет в эту неделю, отметить нельзя", async () => {
    await savePractice(manager, { title: "Медитация на качество силы", frequency: "weekly", position: 1, alternation: "first" });
    await getMyProgram(anna, day(1));
    const [meditation] = await listPracticesForStaff(manager);
    await expect(setPracticeDone(anna, meditation.id, true, day(22))).rejects.toThrow("не найдена");
  });

  it("на слабую стихию — вариант слабой стихии человека; без даты рождения практики нет", async () => {
    await savePractice(manager, {
      title: "Осознание на слабую стихию",
      frequency: "awareness",
      position: 2,
      variants: [
        { body: "Про Металл", weakElement: "metal" },
        { body: "Про Дерево", weakElement: "wood" },
      ],
    });
    expect((await getMyProgram(anna, day(1))).awareness).toEqual([]);

    // 15.03.1988: слабые — Металл (1 цифра) и Огонь (0). Первым по кругу от Земли идёт Металл.
    await saveMyBirthDate(anna, "1988-03-15");
    const [awareness] = (await getMyProgram(anna, day(1))).awareness;
    expect(titles([awareness])).toEqual(["Осознание на слабую стихию"]);
    expect(awareness.weakElement).toBe("metal");
    expect(await shownBody("Осознание на слабую стихию", awareness.variantId)).toBe("Про Металл");
  });

  it("несколько слабых — медитация раз в 2 недели прокачивает их по очереди", async () => {
    await savePractice(manager, {
      title: "Медитация на слабую стихию",
      frequency: "weekly",
      position: 1,
      opensOnDay: 8,
      alternation: "second",
      variants: [
        { body: "Металл", weakElement: "metal" },
        { body: "Огонь", weakElement: "fire" },
        { body: "Дерево", weakElement: "wood" },
      ],
    });
    // 15.03.1988: слабые Металл и Огонь. Медитация стоит во 2-ю, 4-ю, 6-ю… неделю.
    await saveMyBirthDate(anna, "1988-03-15");
    await getMyProgram(anna, day(1)); // программа начинается в день первого открытия
    const shown = [];
    for (const programDay of [8, 15, 22, 29, 36]) {
      const [meditation] = (await getMyProgram(anna, day(programDay))).weekly;
      shown.push(meditation ? await shownBody(meditation.title, meditation.variantId) : "—");
    }
    expect(shown).toEqual(["Металл", "—", "Огонь", "—", "Металл"]);
  });

  it("вариант на стихию года — по текущей стихии, у всех типов один", async () => {
    await savePractice(manager, {
      title: "Полный цикл зарядки",
      frequency: "weekly",
      position: 1,
      variants: [
        { body: "Зарядка Огня", seasonElement: "fire" },
        { body: "Зарядка Воды", seasonElement: "water" },
      ],
    });
    // 25 декабря — зима, Вода.
    const [charge] = (await getMyProgram(anna, day(1))).weekly;
    expect(await shownBody("Полный цикл зарядки", charge.variantId)).toBe("Зарядка Воды");
  });

  it("варианты сохраняются целиком: при новом сохранении прежние заменяются", async () => {
    const saved = await savePractice(manager, {
      title: "Осознание по книге «2 жизни»",
      frequency: "awareness",
      position: 1,
      variants: [{ body: "Старый", typeIds: [HEALER, "x"] }],
    });
    await savePractice(manager, {
      id: saved.id,
      title: "Осознание по книге «2 жизни»",
      frequency: "awareness",
      position: 1,
      variants: [{ body: "Новый", typeIds: [IDEALIST] }],
    });
    const [item] = await listPracticesForStaff(manager);
    expect(item.variants.map((variant) => [variant.body, variant.typeIds])).toEqual([["Новый", [IDEALIST]]]);
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

  it("пятый день — послание полностью, восьмой — следующее послание", async () => {
    await addMessage("Сурия", 1);
    await addMessage("Эль Морья", 2);
    await getMyProgram(anna, day(1));
    const fifth = await getMyNavigator(anna, day(5));
    expect(fifth).toMatchObject({ kind: "full", masterName: "Сурия" });
    expect(fifth?.parts).toHaveLength(2);
    expect((await getMyNavigator(anna, day(8)))?.masterName).toBe("Эль Морья");
  });

  it("6-й и 7-й день — послание старцев для типа, задания первого и второго дня", async () => {
    await addMessage("Сурия", 1);
    await addElders("Старцы 1", 1);
    await addElders("Старцы 2", 2);
    await addElders("Для Идеалиста", 0, [IDEALIST]);
    await getMyProgram(anna, day(1));
    expect(await getMyNavigator(anna, day(6))).toMatchObject({
      kind: "elders",
      masterName: null,
      elders: { title: "Старцы 1", body: "Старцы 1: текст" },
      task: "Сурия: задание 1",
    });
    expect(await getMyNavigator(anna, day(7))).toMatchObject({ elders: { title: "Старцы 1" }, task: "Сурия: задание 2" });
    // Вторая неделя — следующее послание старцев, третья — снова первое.
    expect((await getMyNavigator(anna, day(13)))?.elders?.title).toBe("Старцы 2");
    expect((await getMyNavigator(anna, day(20)))?.elders?.title).toBe("Старцы 1");
  });

  it("без послания старцев для типа в 6-й и 7-й день навигатора нет", async () => {
    await addMessage("Сурия", 1);
    await getMyProgram(anna, day(1));
    expect(await getMyNavigator(anna, day(6))).toBeNull();
  });

  it("послание старцев — с заголовком, текстом и хотя бы одним типом", async () => {
    await expect(saveElderMessage(manager, { title: "", body: "Текст", typeIds: [HEALER] })).rejects.toThrow("Заполните");
    await expect(saveElderMessage(manager, { title: "Т", body: "Текст", typeIds: [] })).rejects.toThrow("типам");
    await expect(saveElderMessage(anna, { title: "Т", body: "Текст", typeIds: [HEALER] })).rejects.toThrow();
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
