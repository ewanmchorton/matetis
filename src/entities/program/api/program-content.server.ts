// Наполнение программы: практики и послания навигатора. Только серверный код.
// Меняют админ и контент-менеджер.
import { asc, eq } from "drizzle-orm";

import { getPersonTypes } from "@/entities/person-type";
import { assertStaff } from "@/shared/auth/assert-admin";
import { db, navigatorMessage, navigatorMessageType, navigatorPart, practice } from "@/shared/db";
import { AppError } from "@/shared/lib/app-error";

export type Practice = typeof practice.$inferSelect;

export type PracticeInput = {
  title?: unknown;
  frequency?: unknown;
  daypart?: unknown;
  position?: unknown;
  body?: unknown;
  videoUrl?: unknown;
  opensOnDay?: unknown;
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

function practiceValues(input: PracticeInput) {
  const title = text(input.title);
  if (!title) throw new AppError("empty_title", "Напишите название практики");
  if (input.frequency !== "daily" && input.frequency !== "weekly") {
    throw new AppError("invalid_frequency", "Выберите: ежедневная или еженедельная");
  }
  const daypart = input.frequency === "daily" ? input.daypart : null;
  if (input.frequency === "daily" && daypart !== "morning" && daypart !== "evening") {
    throw new AppError("invalid_daypart", "Выберите для ежедневной практики: утро или вечер");
  }
  const videoUrl = optionalText(input.videoUrl);
  if (videoUrl && !/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(videoUrl)) {
    throw new AppError("invalid_video", "Видео — ссылка на YouTube");
  }
  return {
    title,
    frequency: input.frequency,
    daypart: daypart as "morning" | "evening" | null,
    position: wholeNumber(input.position, 0, 0),
    body: text(input.body),
    videoUrl,
    opensOnDay: wholeNumber(input.opensOnDay, 1, 1),
  } as const;
}

/** Все практики по порядку: сначала утро, вечер, потом еженедельные. */
export async function listPracticesForStaff(viewerId: string): Promise<Practice[]> {
  await assertStaff(viewerId);
  return listPractices();
}

export function listPractices(): Promise<Practice[]> {
  return db.select().from(practice).orderBy(asc(practice.frequency), asc(practice.daypart), asc(practice.position));
}

/** Добавить практику (без id) или изменить существующую. */
export async function savePractice(viewerId: string, input: PracticeInput & { id?: unknown }) {
  await assertStaff(viewerId);
  const values = practiceValues(input);
  if (typeof input.id === "string") {
    const [row] = await db.update(practice).set(values).where(eq(practice.id, input.id)).returning();
    if (!row) throw new AppError("not_found", "Практика не найдена");
    return row;
  }
  const [row] = await db.insert(practice).values(values).returning();
  return row;
}

export async function deletePractice(viewerId: string, id: unknown) {
  await assertStaff(viewerId);
  if (typeof id === "string") await db.delete(practice).where(eq(practice.id, id));
  return { ok: true };
}

export type NavigatorMessageInput = {
  id?: unknown;
  masterName?: unknown;
  position?: unknown;
  day7Task?: unknown;
  typeIds?: unknown;
  /** Ровно три части по порядку. */
  parts?: unknown;
};

export type NavigatorMessage = {
  id: string;
  masterName: string;
  position: number;
  day7Task: string | null;
  typeIds: string[];
  parts: { part: number; title: string; body: string; firstDayTask: string | null; secondDayTask: string | null }[];
};

function messageParts(input: unknown) {
  const parts = Array.isArray(input) ? input : [];
  if (parts.length !== 3) throw new AppError("invalid_parts", "В послании три части");
  return parts.map((raw, index) => {
    const part = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const title = text(part.title);
    const body = text(part.body);
    if (!title || !body) throw new AppError("empty_part", `Заполните заголовок и текст части ${index + 1}`);
    return {
      part: index + 1,
      title,
      body,
      firstDayTask: optionalText(part.firstDayTask),
      secondDayTask: optionalText(part.secondDayTask),
    };
  });
}

/** Добавить послание (без id) или заменить существующее целиком: части и типы. */
export async function saveNavigatorMessage(viewerId: string, input: NavigatorMessageInput): Promise<NavigatorMessage> {
  await assertStaff(viewerId);
  const masterName = text(input.masterName);
  if (!masterName) throw new AppError("empty_master", "Напишите имя Мастера");
  const parts = messageParts(input.parts);
  if (!parts[0].firstDayTask || !parts[0].secondDayTask) {
    throw new AppError("empty_tasks", "Заполните оба задания первой части — остальные части их повторяют");
  }
  const known = new Set(getPersonTypes().map((type) => type.id));
  const typeIds = Array.isArray(input.typeIds) ? [...new Set(input.typeIds.filter((id) => known.has(id)))] : [];
  if (typeIds.length === 0) throw new AppError("empty_types", "Отметьте, каким типам подходит послание");
  const values = { masterName, position: wholeNumber(input.position, 0, 0), day7Task: optionalText(input.day7Task) };

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
    masterName: message.masterName,
    position: message.position,
    day7Task: message.day7Task,
    typeIds: types.filter((type) => type.messageId === message.id).map((type) => type.typeId),
    parts: parts
      .filter((part) => part.messageId === message.id)
      .map(({ part, title, body, firstDayTask, secondDayTask }) => ({ part, title, body, firstDayTask, secondDayTask })),
  }));
}
