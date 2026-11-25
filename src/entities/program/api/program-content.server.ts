// Наполнение программы: практики и послания навигатора. Только серверный код.
// Меняют админ и контент-менеджер.
import { and, asc, eq, sql } from "drizzle-orm";

import { getPersonTypes } from "@/entities/person-type";
import { assertStaff } from "@/shared/auth/assert-admin";
import {
  db,
  navigatorMessage,
  navigatorMessageType,
  navigatorPart,
  practice,
  practiceVariant,
  practiceVariantType,
  programVideo,
} from "@/shared/db";
import { AppError } from "@/shared/lib/app-error";

const elementIds = ["wood", "fire", "earth", "metal", "water"] as const;
type ElementId = (typeof elementIds)[number];

export type PracticeVariant = {
  id: string;
  position: number;
  body: string;
  audioPath: string | null;
  videoUrl: string | null;
  /** Ни одного – всем типам. */
  typeIds: string[];
  weakElement: ElementId | null;
  seasonElement: ElementId | null;
  /** Свои недели. Пусто – как у практики. */
  spanWeeks: number | null;
};

export type Practice = typeof practice.$inferSelect & { variants: PracticeVariant[] };

export type PracticeInput = {
  title?: unknown;
  frequency?: unknown;
  daypart?: unknown;
  position?: unknown;
  body?: unknown;
  videoUrl?: unknown;
  opensOnDay?: unknown;
  /** Сколько недель показывать вариант. Пусто – на всю стихию. */
  spanWeeks?: unknown;
  /** Пара медитаций: вторая сменяет первую. */
  alternation?: unknown;
  /** Можно ли проходить вместе с другом. Не передано – можно. */
  allowTogether?: unknown;
  /** Варианты по порядку. Сохраняются целиком, заменяя прежние. */
  variants?: unknown;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown): string | null {
  return text(value) || null;
}

function wholeNumber(value: unknown, min: number, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= min ? value : fallback;
}

function youTubeUrl(value: unknown): string | null {
  const videoUrl = optionalText(value);
  if (videoUrl && !/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(videoUrl)) {
    throw new AppError("invalid_video", "Видео – ссылка на YouTube");
  }
  return videoUrl;
}

function elementOrNull(value: unknown): ElementId | null {
  return elementIds.find((id) => id === value) ?? null;
}

/** Пусто или не число – на всю стихию. */
function spanWeeks(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 ? value : null;
}

function practiceValues(input: PracticeInput) {
  const title = text(input.title);
  if (!title) throw new AppError("empty_title", "Напишите название практики");
  if (input.frequency !== "daily" && input.frequency !== "weekly" && input.frequency !== "awareness") {
    throw new AppError("invalid_frequency", "Выберите вид практики");
  }
  const daypart = input.frequency === "daily" ? input.daypart : null;
  if (input.frequency === "daily" && daypart !== "morning" && daypart !== "evening") {
    throw new AppError("invalid_daypart", "Выберите для ежедневной практики: утро или вечер");
  }
  return {
    title,
    frequency: input.frequency,
    daypart: daypart as "morning" | "evening" | null,
    position: wholeNumber(input.position, 0, 0),
    body: text(input.body),
    videoUrl: youTubeUrl(input.videoUrl),
    opensOnDay: wholeNumber(input.opensOnDay, 1, 1),
    spanWeeks: input.frequency === "daily" ? null : spanWeeks(input.spanWeeks),
    alternation: input.alternation === "first" || input.alternation === "second" ? input.alternation : null,
    allowTogether: input.allowTogether !== false,
  } as const;
}

function variantValues(input: unknown) {
  const known = new Set(getPersonTypes().map((type) => type.id));
  const variants = Array.isArray(input) ? input : [];
  return variants.map((raw, index) => {
    const variant = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const typeIds = Array.isArray(variant.typeIds) ? [...new Set(variant.typeIds.filter((id) => known.has(id)))] : [];
    return {
      position: index + 1,
      body: text(variant.body),
      videoUrl: youTubeUrl(variant.videoUrl),
      weakElement: elementOrNull(variant.weakElement),
      seasonElement: elementOrNull(variant.seasonElement),
      spanWeeks: spanWeeks(variant.spanWeeks),
      typeIds: typeIds as string[],
    };
  });
}

/** Все практики по порядку: сначала утро, вечер, потом еженедельные. */
export async function listPracticesForStaff(viewerId: string): Promise<Practice[]> {
  await assertStaff(viewerId);
  return listPractices();
}

/** Практики с вариантами по порядку. */
export async function listPractices(): Promise<Practice[]> {
  const [practices, variants, types] = await Promise.all([
    db.select().from(practice).orderBy(asc(practice.frequency), asc(practice.daypart), asc(practice.position)),
    db.select().from(practiceVariant).orderBy(asc(practiceVariant.position)),
    db.select().from(practiceVariantType),
  ]);
  return practices.map((item) => ({
    ...item,
    variants: variants
      .filter((variant) => variant.practiceId === item.id)
      .map((variant) => ({
        id: variant.id,
        position: variant.position,
        body: variant.body,
        audioPath: variant.audioPath,
        videoUrl: variant.videoUrl,
        weakElement: elementOrNull(variant.weakElement),
        seasonElement: elementOrNull(variant.seasonElement),
        spanWeeks: variant.spanWeeks,
        typeIds: types.filter((type) => type.variantId === variant.id).map((type) => type.typeId),
      })),
  }));
}

/** Добавить практику (без id) или изменить существующую вместе с вариантами. */
export async function savePractice(viewerId: string, input: PracticeInput & { id?: unknown }) {
  await assertStaff(viewerId);
  const values = practiceValues(input);
  const variants = variantValues(input.variants);
  return db.transaction(async (tx) => {
    let row: typeof practice.$inferSelect | undefined;
    if (typeof input.id === "string") {
      [row] = await tx.update(practice).set(values).where(eq(practice.id, input.id)).returning();
      if (!row) throw new AppError("not_found", "Практика не найдена");
      await tx.delete(practiceVariant).where(eq(practiceVariant.practiceId, row.id));
    } else {
      [row] = await tx.insert(practice).values(values).returning();
    }
    for (const { typeIds, ...variant } of variants) {
      const [saved] = await tx
        .insert(practiceVariant)
        .values({ ...variant, practiceId: row.id })
        .returning({ id: practiceVariant.id });
      if (typeIds.length > 0) {
        await tx.insert(practiceVariantType).values(typeIds.map((typeId) => ({ variantId: saved.id, typeId })));
      }
    }
    return row;
  });
}

export async function deletePractice(viewerId: string, id: unknown) {
  await assertStaff(viewerId);
  if (typeof id === "string") await db.delete(practice).where(eq(practice.id, id));
  return { ok: true };
}

type SectionGroup = "type" | "weak" | "season";

function sectionGroup(value: unknown): SectionGroup {
  if (value === "type" || value === "weak" || value === "season") return value;
  throw new AppError("invalid_group", "Неизвестный раздел");
}

async function practiceByTitle(title: string, frequency: "weekly" | "awareness") {
  const [row] = await db
    .select()
    .from(practice)
    .where(and(eq(practice.title, title), eq(practice.frequency, frequency)))
    .limit(1);
  return row;
}

/** Раздел «На стихию» или «Осознания»: практика с таким названием уже есть или создаётся пустой. */
export async function ensureSectionPractice(
  viewerId: string,
  input: { title?: unknown; frequency?: unknown; alternation?: unknown; opensOnDay?: unknown },
) {
  await assertStaff(viewerId);
  const title = text(input.title);
  const frequency = input.frequency === "weekly" || input.frequency === "awareness" ? input.frequency : null;
  if (!title || !frequency) throw new AppError("empty_title", "Напишите название практики");
  const existing = await practiceByTitle(title, frequency);
  if (existing) return existing;
  const [max] = await db.select({ value: sql<number>`coalesce(max(${practice.position}), 0)` }).from(practice);
  const alternation = input.alternation === "first" || input.alternation === "second" ? input.alternation : null;
  const [row] = await db
    .insert(practice)
    .values({
      title,
      frequency,
      daypart: null,
      position: Number(max?.value ?? 0) + 1,
      body: "",
      opensOnDay: wholeNumber(input.opensOnDay, 1, 1),
      alternation,
      allowTogether: frequency !== "awareness",
    })
    .returning();
  return row;
}

async function variantsOf(practiceId: string) {
  const [variants, types] = await Promise.all([
    db.select().from(practiceVariant).where(eq(practiceVariant.practiceId, practiceId)).orderBy(asc(practiceVariant.position)),
    db.select().from(practiceVariantType),
  ]);
  return variants.map((variant) => ({
    ...variant,
    typeIds: types.filter((type) => type.variantId === variant.id).map((type) => type.typeId),
  }));
}

function sameSection(
  variant: { typeIds: string[]; weakElement: string | null; seasonElement: string | null },
  groupBy: SectionGroup,
  key: string,
) {
  if (groupBy === "weak") return variant.weakElement === key;
  if (groupBy === "season") return variant.seasonElement === key;
  return variant.typeIds[0] === key;
}

/** Поставить запись на место в очереди своего типа или стихии. Номера внутри очереди не пересекаются с чужими. */
async function placeVariant(practiceId: string, variantId: string, groupBy: SectionGroup, key: string, order: number) {
  const variants = await variantsOf(practiceId);
  const mine = variants.find((variant) => variant.id === variantId);
  if (!mine) return;
  const rest = variants.filter((variant) => variant.id !== variantId && sameSection(variant, groupBy, key));
  rest.sort((a, b) => a.position - b.position);
  const index = Math.min(Math.max(order, 1), rest.length + 1) - 1;
  rest.splice(index, 0, mine);
  const slots = rest.map((variant) => variant.position).sort((a, b) => a - b);
  await db.transaction(async (tx) => {
    for (let i = 0; i < rest.length; i += 1) {
      if (rest[i].position !== slots[i]) {
        await tx.update(practiceVariant).set({ position: slots[i] }).where(eq(practiceVariant.id, rest[i].id));
      }
    }
  });
}

/**
 * Одна медитация, вопрос или зарядка внутри раздела.
 * practiceId – уже существующая практика. Иначе её создаёт ensure, и id приходит в practice.
 */
export async function saveSectionVariant(
  viewerId: string,
  input: {
    practiceId?: unknown;
    groupBy?: unknown;
    key?: unknown;
    order?: unknown;
    id?: unknown;
    body?: unknown;
    videoUrl?: unknown;
    typeIds?: unknown;
    weakElement?: unknown;
    seasonElement?: unknown;
    spanWeeks?: unknown;
  },
) {
  await assertStaff(viewerId);
  const practiceId = text(input.practiceId);
  if (!practiceId) throw new AppError("not_found", "Практика не найдена");
  const [parent] = await db.select().from(practice).where(eq(practice.id, practiceId)).limit(1);
  if (!parent) throw new AppError("not_found", "Практика не найдена");
  const groupBy = sectionGroup(input.groupBy);
  const key = text(input.key);
  if (!key) throw new AppError("empty_types", "Выберите тип или стихию");
  const [variant] = variantValues([input]);
  const order = wholeNumber(input.order, 1, 1);

  const id = await db.transaction(async (tx) => {
    if (typeof input.id === "string") {
      const [row] = await tx
        .update(practiceVariant)
        .set({
          body: variant.body,
          videoUrl: variant.videoUrl,
          weakElement: variant.weakElement,
          seasonElement: variant.seasonElement,
          spanWeeks: variant.spanWeeks,
        })
        .where(and(eq(practiceVariant.id, input.id), eq(practiceVariant.practiceId, practiceId)))
        .returning();
      if (!row) throw new AppError("not_found", "Запись не найдена");
      await tx.delete(practiceVariantType).where(eq(practiceVariantType.variantId, row.id));
      if (variant.typeIds.length > 0) {
        await tx.insert(practiceVariantType).values(variant.typeIds.map((typeId) => ({ variantId: row.id, typeId })));
      }
      return row.id;
    }
    const [max] = await tx
      .select({ value: sql<number>`coalesce(max(${practiceVariant.position}), 0)` })
      .from(practiceVariant)
      .where(eq(practiceVariant.practiceId, practiceId));
    const [row] = await tx
      .insert(practiceVariant)
      .values({
        practiceId,
        position: Number(max?.value ?? 0) + 1,
        body: variant.body,
        videoUrl: variant.videoUrl,
        weakElement: variant.weakElement,
        seasonElement: variant.seasonElement,
        spanWeeks: variant.spanWeeks,
      })
      .returning();
    if (variant.typeIds.length > 0) {
      await tx.insert(practiceVariantType).values(variant.typeIds.map((typeId) => ({ variantId: row.id, typeId })));
    }
    return row.id;
  });

  await placeVariant(practiceId, id, groupBy, key, order);
  return { id };
}

export async function deleteSectionVariant(viewerId: string, id: unknown) {
  await assertStaff(viewerId);
  if (typeof id === "string") await db.delete(practiceVariant).where(eq(practiceVariant.id, id));
  return { ok: true };
}

/** Перетащить записи внутри одного типа или одной стихии. */
export async function reorderPracticeVariants(viewerId: string, practiceId: unknown, ids: unknown) {
  await assertStaff(viewerId);
  if (typeof practiceId !== "string" || !Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    throw new AppError("invalid_order", "Не получилось сохранить порядок");
  }
  const rows = await db.select().from(practiceVariant).where(eq(practiceVariant.practiceId, practiceId));
  const byId = new Map(rows.map((row) => [row.id, row]));
  if (ids.length === 0 || ids.some((id) => !byId.has(id as string))) {
    throw new AppError("invalid_order", "Не получилось сохранить порядок");
  }
  const slots = ids.map((id) => byId.get(id as string)!.position).sort((a, b) => a - b);
  await db.transaction(async (tx) => {
    for (let index = 0; index < ids.length; index += 1) {
      await tx.update(practiceVariant).set({ position: slots[index] }).where(eq(practiceVariant.id, ids[index] as string));
    }
  });
  return { ok: true };
}

/** Перетащить послания внутри одного типа. */
export async function reorderNavigatorMessages(viewerId: string, typeId: unknown, ids: unknown) {
  await assertStaff(viewerId);
  const known = new Set(getPersonTypes().map((type) => type.id));
  if (typeof typeId !== "string" || !known.has(typeId) || !Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    throw new AppError("invalid_order", "Не получилось сохранить порядок");
  }
  const links = await db.select().from(navigatorMessageType).where(eq(navigatorMessageType.typeId, typeId));
  const allowed = new Set(links.map((link) => link.messageId));
  if (ids.some((id) => !allowed.has(id as string))) throw new AppError("invalid_order", "Не получилось сохранить порядок");
  const rows = await db.select().from(navigatorMessage);
  const byId = new Map(rows.map((row) => [row.id, row]));
  const slots = ids.map((id) => byId.get(id as string)?.position ?? 0).sort((a, b) => a - b);
  await db.transaction(async (tx) => {
    for (let index = 0; index < ids.length; index += 1) {
      await tx.update(navigatorMessage).set({ position: slots[index] }).where(eq(navigatorMessage.id, ids[index] as string));
    }
  });
  return { ok: true };
}

export type NavigatorMessageInput = {
  id?: unknown;
  title?: unknown;
  masterName?: unknown;
  /** Дата послания: «2006-07-04». */
  givenOn?: unknown;
  intro?: unknown;
  closing?: unknown;
  position?: unknown;
  day7Task?: unknown;
  typeIds?: unknown;
  /** Ровно три части по порядку. */
  parts?: unknown;
};

export type NavigatorMessage = {
  id: string;
  title: string;
  masterName: string;
  givenOn: string;
  intro: string;
  closing: string;
  position: number;
  day7Task: string | null;
  typeIds: string[];
  parts: { part: number; title: string; body: string; firstDayTask: string | null; secondDayTask: string | null }[];
};

const PARTS_COUNT = 3;

function messageParts(input: unknown) {
  const parts = Array.isArray(input) ? input : [];
  if (parts.length !== PARTS_COUNT) throw new AppError("invalid_parts", "В послании три части");
  return parts.map((raw, index) => {
    const part = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const title = text(part.title);
    const body = text(part.body);
    const firstDayTask = optionalText(part.firstDayTask);
    if (!title || !body || !firstDayTask) {
      throw new AppError("empty_part", `Заполните название, текст и задание первого дня части ${index + 1}`);
    }
    return { part: index + 1, title, body, firstDayTask, secondDayTask: optionalText(part.secondDayTask) };
  });
}

/** «2006-07-04» – настоящая дата; иначе ошибка. */
function messageDate(input: unknown): string {
  const value = typeof input === "string" ? input.trim() : "";
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);
  if (!valid) throw new AppError("empty_date", "Укажите дату послания");
  return value;
}

/** Добавить послание (без id) или заменить существующее целиком: части и типы. */
export async function saveNavigatorMessage(viewerId: string, input: NavigatorMessageInput): Promise<NavigatorMessage> {
  await assertStaff(viewerId);
  const title = text(input.title);
  const masterName = text(input.masterName);
  const intro = text(input.intro);
  const closing = text(input.closing);
  if (!title) throw new AppError("empty_title", "Напишите название послания");
  if (!masterName) throw new AppError("empty_master", "Напишите имя Мастера");
  const givenOn = messageDate(input.givenOn);
  if (!intro || !closing) throw new AppError("empty_text", "Заполните вступление и завершение");
  const parts = messageParts(input.parts);
  const known = new Set(getPersonTypes().map((type) => type.id));
  const typeIds = Array.isArray(input.typeIds) ? [...new Set(input.typeIds.filter((id) => known.has(id)))] : [];
  if (typeIds.length === 0) throw new AppError("empty_types", "Отметьте, каким типам подходит послание");
  const values = {
    title,
    masterName,
    givenOn,
    intro,
    closing,
    position: wholeNumber(input.position, 0, 0),
    day7Task: optionalText(input.day7Task),
  };

  const id = await db.transaction(async (tx) => {
    let messageId: string;
    if (typeof input.id === "string") {
      const [row] = await tx.update(navigatorMessage).set(values).where(eq(navigatorMessage.id, input.id)).returning();
      if (!row) throw new AppError("not_found", "Послание не найдено");
      messageId = row.id;
      await tx.delete(navigatorPart).where(eq(navigatorPart.messageId, messageId));
      await tx.delete(navigatorMessageType).where(eq(navigatorMessageType.messageId, messageId));
    } else {
      const [row] = await tx.insert(navigatorMessage).values(values).returning();
      messageId = row.id;
    }
    await tx.insert(navigatorPart).values(parts.map((part) => ({ ...part, messageId })));
    await tx.insert(navigatorMessageType).values(typeIds.map((typeId) => ({ messageId, typeId })));
    return messageId;
  });
  return { id, ...values, typeIds, parts };
}

export async function deleteNavigatorMessage(viewerId: string, id: unknown) {
  await assertStaff(viewerId);
  if (typeof id === "string") await db.delete(navigatorMessage).where(eq(navigatorMessage.id, id));
  return { ok: true };
}

/** Все послания по порядку, с частями и типами. */
export async function listNavigatorMessagesForStaff(viewerId: string): Promise<NavigatorMessage[]> {
  await assertStaff(viewerId);
  const [messages, parts, types] = await Promise.all([
    db.select().from(navigatorMessage).orderBy(asc(navigatorMessage.position), asc(navigatorMessage.createdAt)),
    db.select().from(navigatorPart).orderBy(asc(navigatorPart.part)),
    db.select().from(navigatorMessageType),
  ]);
  return messages.map((message) => ({
    id: message.id,
    title: message.title,
    masterName: message.masterName,
    givenOn: message.givenOn,
    intro: message.intro,
    closing: message.closing,
    position: message.position,
    day7Task: message.day7Task,
    typeIds: types.filter((type) => type.messageId === message.id).map((type) => type.typeId),
    parts: parts
      .filter((part) => part.messageId === message.id)
      .map(({ part, title, body, firstDayTask, secondDayTask }) => ({ part, title, body, firstDayTask, secondDayTask })),
  }));
}

/** Места для видео в разделе «Библиотека»: приветственное и по каждой стихии. */
export const programVideoSlots = ["welcome", "water", "wood", "fire", "earth", "metal"] as const;
export type ProgramVideoSlot = (typeof programVideoSlots)[number];
export type ProgramVideo = { slot: ProgramVideoSlot; videoUrl: string | null; body: string };

/** Все видео библиотеки по порядку; незаполненные – пустые. */
export async function listProgramVideosForStaff(viewerId: string): Promise<ProgramVideo[]> {
  await assertStaff(viewerId);
  const rows = await db.select().from(programVideo);
  return programVideoSlots.map((slot) => {
    const row = rows.find((item) => item.slot === slot);
    return { slot, videoUrl: row?.videoUrl ?? null, body: row?.body ?? "" };
  });
}

/** Сохранить видео: ссылку на YouTube и текст. */
export async function saveProgramVideo(viewerId: string, input: { slot?: unknown; videoUrl?: unknown; body?: unknown }) {
  await assertStaff(viewerId);
  const slot = programVideoSlots.find((item) => item === input.slot);
  if (!slot) throw new AppError("invalid_slot", "Неизвестное видео");
  const videoUrl = youTubeUrl(input.videoUrl);
  const values = { slot, videoUrl, body: text(input.body), updatedAt: new Date() };
  await db.insert(programVideo).values(values).onConflictDoUpdate({ target: programVideo.slot, set: values });
  return { slot, videoUrl, body: values.body };
}
