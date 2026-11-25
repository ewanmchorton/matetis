// Программа человека на сегодня: открытые практики, отметки, навигатор. Только серверный код.
// Доступ к программе проверяет вызывающий код. Дни – по часам телефона человека (его часовой пояс
// в настройках); пока телефон его не сообщил – по Минску.
import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";

import { getMyBirthReading, weakElements } from "@/entities/birth-reading/server";
import { DEFAULT_TIME_ZONE, localDay } from "@/entities/daily-phrase";
import type { ElementId } from "@/entities/element";
import { getCurrentSeason, type Season } from "@/entities/element/server";
import { getMyCurrentType } from "@/entities/type-test-attempt/server";
import {
  db,
  elementVideoSeen,
  navigatorMessage,
  navigatorMessageType,
  navigatorPart,
  navigatorRead,
  personSettings,
  practiceMark,
  practiceNote,
  programStart,
  programVideo,
  user,
  welcomeVideoSeen,
} from "@/shared/db";
import { AppError } from "@/shared/lib/app-error";

import {
  chainPosition,
  navigatorDay,
  navigatorPosition,
  programDayNumber,
  programWeek,
  weekDays,
  type NavigatorDay,
} from "../model/program-day";
import { listPractices, type Practice, type PracticeVariant } from "./program-content.server";

/** Сегодняшний день по часам человека: «2026-12-25». */
export async function todayFor(userId: string, now: Date): Promise<string> {
  const [row] = await db
    .select({ timeZone: personSettings.timeZone })
    .from(personSettings)
    .where(eq(personSettings.userId, userId));
  return localDay(now, row?.timeZone ?? DEFAULT_TIME_ZONE);
}

/** Первый день человека в программе. В первый раз – сегодня. */
async function startedOn(userId: string, today: string): Promise<string> {
  await db.insert(programStart).values({ userId, startedOn: today }).onConflictDoNothing();
  const [row] = await db.select().from(programStart).where(eq(programStart.userId, userId));
  return row.startedOn;
}

export type NavigatorToday = NavigatorDay & {
  messageId: string;
  masterName: string;
  /** Дата послания: «2006-07-04». */
  givenOn: string;
  read: boolean;
};

/**
 * Послание человека на этот день программы: по порядку для его типа, по кругу.
 * null – нет типа или посланий для него.
 */
async function navigatorFor(userId: string, programDay: number, today: string): Promise<NavigatorToday | null> {
  const type = await getMyCurrentType(userId);
  if (!type) return null;
  const messages = await db
    .select({
      id: navigatorMessage.id,
      title: navigatorMessage.title,
      masterName: navigatorMessage.masterName,
      givenOn: navigatorMessage.givenOn,
      intro: navigatorMessage.intro,
      closing: navigatorMessage.closing,
      day7Task: navigatorMessage.day7Task,
    })
    .from(navigatorMessage)
    .innerJoin(navigatorMessageType, eq(navigatorMessageType.messageId, navigatorMessage.id))
    .where(eq(navigatorMessageType.typeId, type.id))
    .orderBy(asc(navigatorMessage.position), asc(navigatorMessage.createdAt));
  if (messages.length === 0) return null;

  const { messageNumber, cycleDay } = navigatorPosition(programDay);
  const message = messages[messageNumber % messages.length];
  const day = navigatorDay(
    message,
    await db.select().from(navigatorPart).where(eq(navigatorPart.messageId, message.id)),
    cycleDay,
  );
  const [read] = await db
    .select({ day: navigatorRead.day })
    .from(navigatorRead)
    .where(and(eq(navigatorRead.userId, userId), eq(navigatorRead.day, today)));
  return { ...day, messageId: message.id, masterName: message.masterName, givenOn: message.givenOn, read: Boolean(read) };
}

type Person = {
  name: string;
  typeId: string | null;
  typeName: string | null;
  /** Слабые стихии по кругу от Земли. Практика на слабую стихию берёт их по очереди. */
  weakElements: ElementId[];
  seasonElement: string;
};

/** Имя, тип, слабая стихия и стихия года. По типу и стихиям выбирается вариант практики. */
export async function personFor(userId: string, season: Pick<Season, "elementId">): Promise<Person> {
  const [type, reading, [row]] = await Promise.all([
    getMyCurrentType(userId),
    getMyBirthReading(userId),
    db.select({ name: user.name }).from(user).where(eq(user.id, userId)),
  ]);
  return {
    name: row?.name ?? "",
    typeId: type?.id ?? null,
    typeName: type?.name ?? null,
    weakElements: reading ? weakElements(reading.elements) : [],
    seasonElement: season.elementId,
  };
}

/** Год, в котором начался период стихии: зима с декабря относится к году декабря. */
function seasonYear(today: string, element: ElementId): number {
  const year = Number(today.slice(0, 4));
  return element === "water" && Number(today.slice(5, 7)) < 12 ? year - 1 : year;
}

function fits(variant: PracticeVariant, person: Person, weakElement: ElementId | null) {
  return (
    (variant.typeIds.length === 0 || (person.typeId !== null && variant.typeIds.includes(person.typeId))) &&
    (variant.weakElement === null || variant.weakElement === weakElement) &&
    (variant.seasonElement === null || variant.seasonElement === person.seasonElement)
  );
}

type VisiblePractice = { item: Practice; variant: PracticeVariant | null };

function spanOf(variant: PracticeVariant, practiceSpan: number | null): number | null {
  return variant.spanWeeks ?? practiceSpan;
}

/** Сколько недель держится слот. Есть вариант без числа недель – слот на всю стихию. */
function slotSpan(variants: PracticeVariant[], practiceSpan: number | null): number | null {
  if (variants.length === 0) return null;
  let total = 0;
  for (const variant of variants) {
    const span = spanOf(variant, practiceSpan);
    if (span === null) return null;
    total += span;
  }
  return total;
}

/**
 * Какой вариант видит человек через сколько недель после появления практики.
 * Пустая длительность – первый подходящий на всю стихию.
 * Число недель – столько держится вариант, потом следующий, по кругу.
 * Варианты на слабую стихию идут по слабым стихиям человека: каждая свои недели.
 */
function pickVariant(item: Practice, person: Person, weeks: number): PracticeVariant | null {
  const byWeak = item.variants.some((variant) => variant.weakElement !== null);
  if (!byWeak) {
    const suitable = item.variants.filter((variant) => fits(variant, person, null));
    if (suitable.length === 0) return null;
    const { index } = chainPosition(
      suitable.map((variant) => spanOf(variant, item.spanWeeks)),
      weeks,
    );
    return suitable[index] ?? null;
  }
  if (person.weakElements.length === 0) return null;
  const slots = person.weakElements
    .map((element) => {
      const matches = item.variants.filter((variant) => fits(variant, person, element));
      return { matches, span: slotSpan(matches, item.spanWeeks) };
    })
    .filter((slot) => slot.matches.length > 0);
  if (slots.length === 0) return null;
  const place = chainPosition(
    slots.map((slot) => slot.span),
    weeks,
  );
  const slot = slots[place.index];
  const { index } = chainPosition(
    slot.matches.map((variant) => spanOf(variant, item.spanWeeks)),
    place.into,
  );
  return slot.matches[index] ?? null;
}

type Step = { item: Practice; variant: PracticeVariant | null; span: number | null };

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Очередь: по одному шагу из каждого списка, пока каждый не пройдёт свой круг. */
function interleave<T>(sequences: T[][]): T[] {
  const lists = sequences.filter((list) => list.length > 0);
  if (lists.length === 0) return [];
  if (lists.length === 1) return lists[0];
  const rounds = lists.map((list) => list.length).reduce((a, b) => (a / gcd(a, b)) * b);
  const cursors = lists.map(() => 0);
  const steps: T[] = [];
  for (let round = 0; round < rounds; round += 1) {
    for (const [index, list] of lists.entries()) {
      steps.push(list[cursors[index] % list.length]);
      cursors[index] += 1;
    }
  }
  return steps;
}

/** Что человек может увидеть в этой практике, по порядку, и сколько недель каждый кусок. */
function contentsOf(item: Practice, person: Person): Step[] {
  const step = (variant: PracticeVariant | null): Step => ({
    item,
    variant,
    span: variant ? spanOf(variant, item.spanWeeks) : item.spanWeeks,
  });
  if (item.variants.length === 0) return [step(null)];
  const byWeak = item.variants.some((variant) => variant.weakElement !== null);
  if (!byWeak) return item.variants.filter((variant) => fits(variant, person, null)).map(step);
  if (person.weakElements.length === 0) return [];
  return person.weakElements.flatMap((element) => item.variants.filter((variant) => fits(variant, person, element)).map(step));
}

/**
 * Ключ пары, где на экране только одна практика.
 * Осознания сменяют друг друга. Медитации с «first» и «second» – тоже: вторая сменяет первую.
 */
function rotationKey(item: Practice): string | null {
  if (item.frequency === "awareness") return "awareness";
  if (item.frequency === "weekly" && (item.alternation === "first" || item.alternation === "second")) return "meditation";
  return null;
}

/** Какая практика из пары видна в этот день. Остальные из пары не показываются. */
function activeInGroups(practices: Practice[], person: Person, programDay: number): Map<string, VisiblePractice> {
  const groups = new Map<string, Practice[]>();
  for (const item of practices) {
    const key = rotationKey(item);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  const active = new Map<string, VisiblePractice>();
  for (const [key, members] of groups) {
    const ordered = [...members].sort((a, b) => {
      if (a.alternation === "first" && b.alternation !== "first") return -1;
      if (b.alternation === "first" && a.alternation !== "first") return 1;
      return a.position - b.position;
    });
    const steps = interleave(ordered.map((item) => contentsOf(item, person)));
    if (steps.length === 0) continue;
    const anchor = Math.min(...steps.map((step) => step.item.opensOnDay));
    const since = programWeek(programDay) - programWeek(anchor);
    let chosen = steps[chainPosition(steps.map((step) => step.span), since).index];
    if (chosen.item.opensOnDay > programDay) {
      chosen = steps.find((step) => step.item.opensOnDay <= programDay) ?? chosen;
    }
    if (chosen.item.opensOnDay > programDay) continue;
    active.set(key, { item: chosen.item, variant: chosen.variant });
  }
  return active;
}

/**
 * Практики человека в этот день программы. Без вариантов – текст самой практики для всех.
 * С вариантами – подходящий человеку. Не подошёл ни один – практики у него нет.
 * Осознание на экране одно. Медитация на слабую стихию сменяет медитацию на качество силы.
 */
export function visiblePractices(practices: Practice[], person: Person, programDay: number): VisiblePractice[] {
  const active = activeInGroups(practices, person, programDay);
  return practices.flatMap((item): VisiblePractice[] => {
    const key = rotationKey(item);
    if (key) {
      const chosen = active.get(key);
      return chosen?.item.id === item.id ? [chosen] : [];
    }
    if (item.opensOnDay > programDay) return [];
    if (item.variants.length === 0) return [{ item, variant: null }];
    const sinceOpen = programWeek(programDay) - programWeek(item.opensOnDay);
    const variant = pickVariant(item, person, sinceOpen);
    return variant ? [{ item, variant }] : [];
  });
}

/**
 * Практики, которые человек видит сегодня. Ничего не записывает: кто ещё не открывал программу,
 * практик не видит. Нужно, чтобы проверить чужую программу (совместная практика).
 */
export async function practicesVisibleTo(userId: string, now = new Date()): Promise<Practice[]> {
  const today = await todayFor(userId, now);
  const [start] = await db.select().from(programStart).where(eq(programStart.userId, userId));
  if (!start) return [];
  const [practices, season] = await Promise.all([listPractices(), getCurrentSeason(now)]);
  const person = await personFor(userId, season);
  return visiblePractices(practices, person, programDayNumber(start.startedOn, today)).map(({ item }) => item);
}

export type ProgramPractice = {
  id: string;
  /** Какой вариант текста видит человек. null – текст самой практики. */
  variantId: string | null;
  title: string;
  daypart: "morning" | "evening" | null;
  hasVideo: boolean;
  hasAudio: boolean;
  /** Текст и видео практики или её варианта для человека. */
  body: string;
  videoUrl: string | null;
  /** Вариант на слабую стихию – какую стихию он прокачивает сейчас (подпись «Слабая стихия: …»). */
  weakElement: ElementId | null;
  /** Ежедневная – отмечена сегодня; еженедельная – день отметки на этой неделе. */
  doneOn: string | null;
};

export type MyProgram = {
  today: string;
  programDay: number;
  season: Season;
  navigator: NavigatorToday | null;
  morning: ProgramPractice[];
  evening: ProgramPractice[];
  weekly: ProgramPractice[];
  awareness: ProgramPractice[];
  /** Семь дней недели с понедельника: был ли в этот день хоть одна выполненная практика. */
  week: { day: string; done: boolean }[];
  /** Приветственное видео ещё не просмотрено – показать перед программой. */
  showWelcomeVideo: boolean;
  /** Приветственное видео, если админ его добавил. */
  welcomeVideo: LibraryVideo | null;
  /** Видео по текущей стихии, если админ его добавил, и посмотрел ли его человек в этот период. */
  elementVideo: (LibraryVideo & { seen: boolean }) | null;
  person: { name: string; typeName: string | null };
};

type LibraryVideo = { videoUrl: string; body: string };

/** Программа человека на сегодня. В первый раз запоминает его первый день. */
export async function getMyProgram(userId: string, now = new Date()): Promise<MyProgram> {
  const today = await todayFor(userId, now);
  const days = weekDays(today);
  const programDay = programDayNumber(await startedOn(userId, today), today);
  const [season, navigator, practices, marks, reads, [welcome], videos] = await Promise.all([
    getCurrentSeason(now),
    navigatorFor(userId, programDay, today),
    listPractices(),
    db
      .select({ practiceId: practiceMark.practiceId, day: practiceMark.day })
      .from(practiceMark)
      .where(and(eq(practiceMark.userId, userId), gte(practiceMark.day, days[0]), lte(practiceMark.day, days[6]))),
    db
      .select({ day: navigatorRead.day })
      .from(navigatorRead)
      .where(and(eq(navigatorRead.userId, userId), gte(navigatorRead.day, days[0]), lte(navigatorRead.day, days[6]))),
    db.select().from(welcomeVideoSeen).where(eq(welcomeVideoSeen.userId, userId)),
    db.select().from(programVideo),
  ]);

  const person = await personFor(userId, season);
  const open = visiblePractices(practices, person, programDay);
  const video = (slot: string): LibraryVideo | null => {
    const row = videos.find((item) => item.slot === slot);
    return row?.videoUrl ? { videoUrl: row.videoUrl, body: row.body } : null;
  };
  const elementVideo = video(season.elementId);
  const [elementSeen] = elementVideo
    ? await db
        .select({ seenAt: elementVideoSeen.seenAt })
        .from(elementVideoSeen)
        .where(
          and(
            eq(elementVideoSeen.userId, userId),
            eq(elementVideoSeen.element, season.elementId),
            eq(elementVideoSeen.seasonYear, seasonYear(today, season.elementId)),
          ),
        )
    : [];
  const view = ({ item, variant }: VisiblePractice): ProgramPractice => ({
    id: item.id,
    variantId: variant?.id ?? null,
    title: item.title,
    daypart: item.daypart,
    hasVideo: Boolean((variant ?? item).videoUrl),
    hasAudio: Boolean((variant ?? item).audioPath),
    body: (variant ?? item).body,
    videoUrl: (variant ?? item).videoUrl,
    weakElement: variant?.weakElement ?? null,
    doneOn:
      marks.find((mark) => mark.practiceId === item.id && (item.frequency === "weekly" || mark.day === today))?.day ??
      null,
  });
  const doneDays = new Set([...marks.map((mark) => mark.day), ...reads.map((read) => read.day)]);
  return {
    today,
    programDay,
    season,
    navigator,
    morning: open.filter(({ item }) => item.daypart === "morning").map(view),
    evening: open.filter(({ item }) => item.daypart === "evening").map(view),
    weekly: open.filter(({ item }) => item.frequency === "weekly").map(view),
    awareness: open.filter(({ item }) => item.frequency === "awareness").map(view),
    week: days.map((day) => ({ day, done: doneDays.has(day) })),
    showWelcomeVideo: !welcome,
    welcomeVideo: video("welcome"),
    elementVideo: elementVideo && { ...elementVideo, seen: Boolean(elementSeen) },
    person: { name: person.name, typeName: person.typeName },
  };
}

/** Навигатор на сегодня для экрана послания. */
export async function getMyNavigator(userId: string, now = new Date()) {
  const today = await todayFor(userId, now);
  const programDay = programDayNumber(await startedOn(userId, today), today);
  return navigatorFor(userId, programDay, today);
}

/**
 * Отметить практику выполненной сегодня или снять отметку.
 * Ежедневная – одна отметка в день, еженедельная – одна в неделю. Закрытую практику отметить нельзя.
 */
export async function setPracticeDone(userId: string, practiceId: unknown, done: boolean, now = new Date()) {
  if (typeof practiceId !== "string") throw new AppError("not_found", "Практика не найдена");
  const today = await todayFor(userId, now);
  const programDay = programDayNumber(await startedOn(userId, today), today);
  const [practices, season] = await Promise.all([listPractices(), getCurrentSeason(now)]);
  const visible = visiblePractices(practices, await personFor(userId, season), programDay);
  const item = visible.find((entry) => entry.item.id === practiceId)?.item;
  if (!item) throw new AppError("not_found", "Практика не найдена");

  const days = item.frequency === "weekly" ? weekDays(today) : [today];
  const period = and(
    eq(practiceMark.userId, userId),
    eq(practiceMark.practiceId, practiceId),
    inArray(practiceMark.day, days),
  );
  if (!done) {
    await db.delete(practiceMark).where(period);
    return { ok: true };
  }
  const [already] = await db.select({ day: practiceMark.day }).from(practiceMark).where(period).limit(1);
  if (!already) await db.insert(practiceMark).values({ userId, practiceId, day: today }).onConflictDoNothing();
  return { ok: true };
}

/** «Прочитано» на экране навигатора. */
export async function markNavigatorRead(userId: string, now = new Date()) {
  const today = await todayFor(userId, now);
  const navigator = await getMyNavigator(userId, now);
  if (!navigator) throw new AppError("no_navigator", "Послание пока не готово");
  await db.insert(navigatorRead).values({ userId, day: today, messageId: navigator.messageId }).onConflictDoNothing();
  return { ok: true };
}

/** Заметка для себя к практике на сегодня. Пустая – удаляется. */
export async function saveMyNote(userId: string, practiceId: unknown, rawText: unknown, now = new Date()) {
  if (typeof practiceId !== "string") throw new AppError("not_found", "Практика не найдена");
  const today = await todayFor(userId, now);
  const key = and(eq(practiceNote.userId, userId), eq(practiceNote.practiceId, practiceId), eq(practiceNote.day, today));
  const text = typeof rawText === "string" ? rawText.trim().slice(0, 2000) : "";
  if (!text) {
    await db.delete(practiceNote).where(key);
    return { text: "" };
  }
  await db
    .insert(practiceNote)
    .values({ userId, practiceId, day: today, text })
    .onConflictDoUpdate({
      target: [practiceNote.userId, practiceNote.practiceId, practiceNote.day],
      set: { text, updatedAt: now },
    });
  return { text };
}

/** Своя заметка к практике на сегодня. */
export async function getMyNote(userId: string, practiceId: string, now = new Date()) {
  const [row] = await db
    .select({ text: practiceNote.text })
    .from(practiceNote)
    .where(and(eq(practiceNote.userId, userId), eq(practiceNote.practiceId, practiceId), eq(practiceNote.day, await todayFor(userId, now))));
  return { text: row?.text ?? "" };
}

/** Человек посмотрел видео по текущей стихии – в этот период оно уходит из «На стихию». */
export async function markElementVideoSeen(userId: string, now = new Date()) {
  const [today, season] = await Promise.all([todayFor(userId, now), getCurrentSeason(now)]);
  await db
    .insert(elementVideoSeen)
    .values({ userId, element: season.elementId, seasonYear: seasonYear(today, season.elementId) })
    .onConflictDoNothing();
  return { ok: true };
}

/** Человек нажал «Просмотрено» у приветственного видео. */
export async function markWelcomeVideoSeen(userId: string) {
  await db.insert(welcomeVideoSeen).values({ userId }).onConflictDoNothing();
  return { ok: true };
}

