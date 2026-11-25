// Картинки стихий: загрузка в админке и адреса для экранов программы.
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { and, asc, eq, sql } from "drizzle-orm";

import { assertStaff } from "@/shared/auth/assert-admin";
import { db, elementImage } from "@/shared/db";
import { AppError } from "@/shared/lib/app-error";

import { getCurrentSeason } from "./element-calendar.server";

const elementIds = ["wood", "fire", "earth", "metal", "water"] as const;
type ElementId = (typeof elementIds)[number];
type ImageKind = "main" | "practice";

const root = path.resolve(process.cwd(), "private", "element-images");
const maxBytes = 8 * 1024 * 1024;
const extensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export type ElementImageFile = { id: string; url: string; position: number };

export type ElementPictures = {
  elementId: ElementId;
  /** Одна картинка: страница стихии в библиотеке и фон программы. */
  main: ElementImageFile | null;
  /** Несколько картинок экранов практик, по порядку. */
  practice: ElementImageFile[];
};

function imageUrl(id: string) {
  return `/api/element-image/${id}`;
}

function asElement(value: unknown): ElementId {
  const id = elementIds.find((item) => item === value);
  if (!id) throw new AppError("invalid_element", "Выберите стихию");
  return id;
}

function toFile(row: { id: string; position: number }): ElementImageFile {
  return { id: row.id, url: imageUrl(row.id), position: row.position };
}

async function picturesFor(elementId: ElementId): Promise<ElementPictures> {
  const rows = await db
    .select()
    .from(elementImage)
    .where(eq(elementImage.elementId, elementId))
    .orderBy(asc(elementImage.position), asc(elementImage.createdAt));
  const main = rows.find((row) => row.kind === "main");
  return {
    elementId,
    main: main ? toFile(main) : null,
    practice: rows.filter((row) => row.kind === "practice").map(toFile),
  };
}

/** Картинки всех стихий для админки. */
export async function listElementPicturesForStaff(viewerId: string): Promise<ElementPictures[]> {
  await assertStaff(viewerId);
  return Promise.all(elementIds.map((elementId) => picturesFor(elementId)));
}

/** Картинки стихии, которая идёт сейчас. Для экранов программы. */
export async function currentElementPictures(now = new Date()): Promise<ElementPictures> {
  const season = await getCurrentSeason(now);
  return picturesFor(season.elementId);
}

/** Прочитать файл картинки. Нет записи или файла – null. */
export async function readElementImage(id: string): Promise<{ data: Buffer; type: string } | null> {
  const [row] = await db.select().from(elementImage).where(eq(elementImage.id, id)).limit(1);
  if (!row) return null;
  const full = path.resolve(root, row.fileName);
  if (full !== path.join(root, row.fileName)) return null;
  try {
    const data = await readFile(full);
    const type = row.fileName.endsWith(".png") ? "image/png" : row.fileName.endsWith(".webp") ? "image/webp" : "image/jpeg";
    return { data, type };
  } catch {
    return null;
  }
}

/** Загрузить картинку стихии. Основная заменяет прежнюю. Экраны практик добавляются в конец. */
export async function saveElementImage(viewerId: string, input: { elementId: unknown; kind: unknown; file: unknown }) {
  await assertStaff(viewerId);
  const elementId = asElement(input.elementId);
  const kind: ImageKind | null = input.kind === "main" || input.kind === "practice" ? input.kind : null;
  if (!kind) throw new AppError("invalid_kind", "Выберите, какая это картинка");
  if (!(input.file instanceof File)) throw new AppError("empty_file", "Выберите картинку");
  if (input.file.size > maxBytes) throw new AppError("file_too_big", "Картинка больше 8 МБ");
  const extension = extensions[input.file.type];
  if (!extension) throw new AppError("invalid_file", "Нужна картинка JPEG, PNG или WebP");

  const bytes = Buffer.from(await input.file.arrayBuffer());
  await mkdir(root, { recursive: true });
  const id = randomUUID();
  const fileName = `${id}${extension}`;
  await writeFile(path.join(root, fileName), bytes);

  let position = 1;
  if (kind === "practice") {
    const [max] = await db
      .select({ value: sql<number>`coalesce(max(${elementImage.position}), 0)` })
      .from(elementImage)
      .where(and(eq(elementImage.elementId, elementId), eq(elementImage.kind, "practice")));
    position = Number(max?.value ?? 0) + 1;
  }

  // Основная одна на стихию: прежнюю убираем до новой, иначе уникальный индекс не пустит.
  const replaced =
    kind === "main"
      ? await db
          .delete(elementImage)
          .where(and(eq(elementImage.elementId, elementId), eq(elementImage.kind, "main")))
          .returning()
      : [];
  await db.insert(elementImage).values({ id, elementId, kind, position, fileName });
  await Promise.all(replaced.map((row) => rm(path.join(root, row.fileName), { force: true })));
  return picturesFor(elementId);
}

/** Удалить картинку. */
export async function deleteElementImage(viewerId: string, id: unknown) {
  await assertStaff(viewerId);
  if (typeof id !== "string") throw new AppError("not_found", "Картинка не найдена");
  const [row] = await db.delete(elementImage).where(eq(elementImage.id, id)).returning();
  if (row) await rm(path.join(root, row.fileName), { force: true });
  return { ok: true };
}

/** Новый порядок картинок экранов практик одной стихии. */
export async function reorderPracticeImages(viewerId: string, elementId: unknown, ids: unknown) {
  await assertStaff(viewerId);
  const element = asElement(elementId);
  if (!Array.isArray(ids) || ids.some((item) => typeof item !== "string")) {
    throw new AppError("invalid_order", "Не получилось сохранить порядок");
  }
  const rows = await db
    .select()
    .from(elementImage)
    .where(and(eq(elementImage.elementId, element), eq(elementImage.kind, "practice")));
  const known = new Set(rows.map((row) => row.id));
  if (ids.length !== rows.length || ids.some((item) => !known.has(item))) {
    throw new AppError("invalid_order", "Не получилось сохранить порядок");
  }
  await db.transaction(async (tx) => {
    for (let index = 0; index < ids.length; index += 1) {
      await tx.update(elementImage).set({ position: index + 1 }).where(eq(elementImage.id, ids[index] as string));
    }
  });
  return picturesFor(element);
}
