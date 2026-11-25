// Разделы библиотеки: страница стихии, редкие практики и уже лежащие на диске книги.
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { and, asc, eq, sql } from "drizzle-orm";

import { bookById, readableBooks, type BookFormat } from "@/entities/library/model/readable-books";
import { assertStaff } from "@/shared/auth/assert-admin";
import { db, elementRecommendation, libraryBookCover, libraryPractice, programVideo } from "@/shared/db";
import { AppError } from "@/shared/lib/app-error";

const elementIds = ["wood", "fire", "earth", "metal", "water"] as const;
type ElementId = (typeof elementIds)[number];
type RecommendationKind = "book" | "film";
type PracticeKind = "video" | "audio";

const audioRoot = path.resolve(process.cwd(), "private", "library-audio");
const bookRoot = path.resolve(process.cwd(), "private", "library-books");
const coverRoot = path.resolve(process.cwd(), "private", "library-covers");
const maxAudioBytes = 30 * 1024 * 1024;
const maxCoverBytes = 8 * 1024 * 1024;
const imageExtensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const audioExtensions: Record<string, string> = {
  "audio/mpeg": ".mp3",
  "audio/mp4": ".m4a",
  "audio/x-m4a": ".m4a",
  "audio/wav": ".wav",
  "audio/webm": ".webm",
};

export type LibraryRecommendation = {
  id: string;
  title: string;
  author: string | null;
  year: number | null;
  /** Адрес обложки. Пусто – картинки ещё нет. */
  coverUrl: string | null;
};

export type LibraryElementPage = {
  id: ElementId;
  videoUrl: string | null;
  body: string;
  books: LibraryRecommendation[];
  films: LibraryRecommendation[];
};

export type LibraryPracticeItem = {
  id: string;
  title: string;
  kind: PracticeKind;
  body: string;
  videoUrl: string | null;
  hasAudio: boolean;
};

export type LibraryBookItem = {
  id: string;
  title: string;
  author: string;
  format: BookFormat;
  /** Файл уже лежит в private/library-books. */
  ready: boolean;
  /** Адрес обложки. Пусто – картинки ещё нет. */
  coverUrl: string | null;
};

function asElement(value: unknown): ElementId {
  const id = elementIds.find((item) => item === value);
  if (!id) throw new AppError("invalid_element", "Выберите стихию");
  return id;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function youTubeUrl(value: unknown): string | null {
  const videoUrl = text(value);
  if (!videoUrl) return null;
  let url: URL;
  try {
    url = new URL(videoUrl);
  } catch {
    throw new AppError("invalid_video", "Нужна ссылка на YouTube");
  }
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "youtu.be" && host !== "youtube.com" && host !== "m.youtube.com") {
    throw new AppError("invalid_video", "Нужна ссылка на YouTube");
  }
  return videoUrl;
}

async function fileReady(file: string) {
  try {
    await access(path.join(bookRoot, file));
    return true;
  } catch {
    return false;
  }
}

function coverAddress(kind: "recommendation" | "book", id: string) {
  return `/api/library/cover/${kind}/${id}`;
}

function imageType(fileName: string) {
  if (fileName.endsWith(".png")) return "image/png";
  if (fileName.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function coverFile(fileName: string) {
  const full = path.resolve(coverRoot, fileName);
  if (full !== path.join(coverRoot, fileName)) return null;
  return full;
}

/** Книги, которые уже лежат в библиотеке. Новые файлы сюда не добавляются этой функцией. */
export async function listLibraryBooks(): Promise<LibraryBookItem[]> {
  const covers = await db.select().from(libraryBookCover);
  const covered = new Set(covers.map((row) => row.bookId));
  return Promise.all(
    readableBooks.map(async (book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      format: book.format,
      ready: await fileReady(book.file),
      coverUrl: covered.has(book.id) ? coverAddress("book", book.id) : null,
    })),
  );
}

/** Страницы стихий, практики и книги. Для админки и для экрана библиотеки. */
export async function libraryCatalog() {
  const [videos, recommendations, practices, books] = await Promise.all([
    db.select().from(programVideo),
    db.select().from(elementRecommendation).orderBy(asc(elementRecommendation.position)),
    db.select().from(libraryPractice).orderBy(asc(libraryPractice.position)),
    listLibraryBooks(),
  ]);
  const elements: LibraryElementPage[] = elementIds.map((id) => {
    const video = videos.find((item) => item.slot === id);
    const rows = recommendations.filter((item) => item.elementId === id);
    const toItem = (row: (typeof rows)[number]): LibraryRecommendation => ({
      id: row.id,
      title: row.title,
      author: row.author,
      year: row.year,
      coverUrl: row.coverPath ? coverAddress("recommendation", row.id) : null,
    });
    return {
      id,
      videoUrl: video?.videoUrl ?? null,
      body: video?.body ?? "",
      books: rows.filter((item) => item.kind === "book").map(toItem),
      films: rows.filter((item) => item.kind === "film").map(toItem),
    };
  });
  const welcome = videos.find((item) => item.slot === "welcome");
  const practiceItems: LibraryPracticeItem[] = [
    {
      id: "welcome",
      title: "Приветственное видео",
      kind: "video",
      body: welcome?.body ?? "",
      videoUrl: welcome?.videoUrl ?? null,
      hasAudio: false,
    },
    ...practices.map((item) => ({
      id: item.id,
      title: item.title,
      kind: item.kind,
      body: item.body,
      videoUrl: item.videoUrl,
      hasAudio: Boolean(item.audioPath),
    })),
  ];
  return { elements, practices: practiceItems, books };
}

export async function libraryCatalogForStaff(viewerId: string) {
  await assertStaff(viewerId);
  return libraryCatalog();
}

export async function addRecommendation(
  viewerId: string,
  input: { elementId?: unknown; kind?: unknown; title?: unknown; author?: unknown; year?: unknown },
) {
  await assertStaff(viewerId);
  const elementId = asElement(input.elementId);
  const kind: RecommendationKind | null = input.kind === "book" || input.kind === "film" ? input.kind : null;
  if (!kind) throw new AppError("invalid_kind", "Выберите книгу или фильм");
  const title = text(input.title);
  if (!title) throw new AppError("empty_title", "Напишите название");
  const author = kind === "book" ? text(input.author) || null : null;
  const rawYear = typeof input.year === "string" ? Number(input.year) : input.year;
  const year = typeof rawYear === "number" && Number.isInteger(rawYear) && rawYear > 1800 ? rawYear : null;
  const [max] = await db
    .select({ value: sql<number>`coalesce(max(${elementRecommendation.position}), 0)` })
    .from(elementRecommendation)
    .where(and(eq(elementRecommendation.elementId, elementId), eq(elementRecommendation.kind, kind)));
  await db.insert(elementRecommendation).values({
    elementId,
    kind,
    title,
    author,
    year,
    position: Number(max?.value ?? 0) + 1,
  });
  return libraryCatalog();
}

export async function deleteRecommendation(viewerId: string, id: unknown) {
  await assertStaff(viewerId);
  if (typeof id !== "string") return libraryCatalog();
  const [row] = await db.delete(elementRecommendation).where(eq(elementRecommendation.id, id)).returning();
  if (row?.coverPath) {
    const full = coverFile(row.coverPath);
    if (full) await rm(full, { force: true });
  }
  return libraryCatalog();
}

async function writtenCover(file: unknown, name: string) {
  if (!(file instanceof File)) throw new AppError("empty_file", "Выберите картинку");
  if (file.size > maxCoverBytes) throw new AppError("file_too_big", "Картинка больше 8 МБ");
  const extension = imageExtensions[file.type];
  if (!extension) throw new AppError("invalid_file", "Нужна картинка JPEG, PNG или WebP");
  await mkdir(coverRoot, { recursive: true });
  const fileName = `${name}${extension}`;
  await writeFile(path.join(coverRoot, fileName), Buffer.from(await file.arrayBuffer()));
  return fileName;
}

/** Обложка книги или фильма на странице стихии. Новая картинка заменяет прежнюю. */
export async function saveRecommendationCover(viewerId: string, input: { id: unknown; file: unknown }) {
  await assertStaff(viewerId);
  if (typeof input.id !== "string") throw new AppError("not_found", "Запись не найдена");
  const [row] = await db.select().from(elementRecommendation).where(eq(elementRecommendation.id, input.id)).limit(1);
  if (!row) throw new AppError("not_found", "Запись не найдена");
  const fileName = await writtenCover(input.file, `recommendation-${row.id}`);
  await db.update(elementRecommendation).set({ coverPath: fileName }).where(eq(elementRecommendation.id, row.id));
  if (row.coverPath && row.coverPath !== fileName) {
    const previous = coverFile(row.coverPath);
    if (previous) await rm(previous, { force: true });
  }
  return libraryCatalog();
}

/** Обложка книги в разделе «Книги». Новая картинка заменяет прежнюю. */
export async function saveBookCover(viewerId: string, input: { id: unknown; file: unknown }) {
  await assertStaff(viewerId);
  const book = typeof input.id === "string" ? bookById(input.id) : undefined;
  if (!book) throw new AppError("not_found", "Книга не найдена");
  const fileName = await writtenCover(input.file, `book-${book.id}`);
  const [previous] = await db.select().from(libraryBookCover).where(eq(libraryBookCover.bookId, book.id)).limit(1);
  if (previous) {
    await db.update(libraryBookCover).set({ fileName }).where(eq(libraryBookCover.bookId, book.id));
    if (previous.fileName !== fileName) {
      const old = coverFile(previous.fileName);
      if (old) await rm(old, { force: true });
    }
  } else {
    await db.insert(libraryBookCover).values({ bookId: book.id, fileName });
  }
  return libraryCatalog();
}

/** Файл обложки. Нет записи или файла – null. */
export async function readLibraryCover(kind: string, id: string): Promise<{ data: Buffer; type: string } | null> {
  const fileName =
    kind === "recommendation"
      ? (
          await db
            .select({ coverPath: elementRecommendation.coverPath })
            .from(elementRecommendation)
            .where(eq(elementRecommendation.id, id))
            .limit(1)
        )[0]?.coverPath
      : kind === "book"
        ? (await db.select({ fileName: libraryBookCover.fileName }).from(libraryBookCover).where(eq(libraryBookCover.bookId, id)).limit(1))[0]
            ?.fileName
        : null;
  if (!fileName) return null;
  const full = coverFile(fileName);
  if (!full) return null;
  try {
    const data = await readFile(full);
    return { data, type: imageType(fileName) };
  } catch {
    return null;
  }
}

export async function saveLibraryPractice(
  viewerId: string,
  input: { id?: unknown; title?: unknown; body?: unknown; kind?: unknown; videoUrl?: unknown },
) {
  await assertStaff(viewerId);
  const title = text(input.title);
  if (!title) throw new AppError("empty_title", "Напишите название");
  const kind: PracticeKind | null = input.kind === "video" || input.kind === "audio" ? input.kind : null;
  if (!kind) throw new AppError("invalid_kind", "Выберите видео или аудио");
  const body = text(input.body);
  const videoUrl = kind === "video" ? youTubeUrl(input.videoUrl) : null;
  if (typeof input.id === "string") {
    const [row] = await db
      .update(libraryPractice)
      .set({ title, body, kind, videoUrl })
      .where(eq(libraryPractice.id, input.id))
      .returning();
    if (!row) throw new AppError("not_found", "Практика не найдена");
    return libraryCatalog();
  }
  const [max] = await db.select({ value: sql<number>`coalesce(max(${libraryPractice.position}), 0)` }).from(libraryPractice);
  await db.insert(libraryPractice).values({
    title,
    body,
    kind,
    videoUrl,
    position: Number(max?.value ?? 0) + 1,
  });
  return libraryCatalog();
}

export async function deleteLibraryPractice(viewerId: string, id: unknown) {
  await assertStaff(viewerId);
  if (typeof id !== "string" || id === "welcome") throw new AppError("not_found", "Эту запись удалить нельзя");
  const [row] = await db.delete(libraryPractice).where(eq(libraryPractice.id, id)).returning();
  if (row?.audioPath) await rm(path.join(audioRoot, row.audioPath), { force: true });
  return libraryCatalog();
}

/** Приложить аудио к редкой практике. Видео-практике файл не нужен. */
export async function savePracticeAudio(viewerId: string, input: { id: unknown; file: unknown }) {
  await assertStaff(viewerId);
  if (typeof input.id !== "string") throw new AppError("not_found", "Практика не найдена");
  if (!(input.file instanceof File)) throw new AppError("empty_file", "Выберите аудио");
  if (input.file.size > maxAudioBytes) throw new AppError("file_too_big", "Аудио больше 30 МБ");
  const extension = audioExtensions[input.file.type];
  if (!extension) throw new AppError("invalid_file", "Нужен файл MP3, M4A или WAV");
  const [row] = await db.select().from(libraryPractice).where(eq(libraryPractice.id, input.id)).limit(1);
  if (!row || row.kind !== "audio") throw new AppError("invalid_kind", "Аудио прикладывается к аудиопрактике");
  await mkdir(audioRoot, { recursive: true });
  const fileName = `${row.id}${extension}`;
  await writeFile(path.join(audioRoot, fileName), Buffer.from(await input.file.arrayBuffer()));
  if (row.audioPath && row.audioPath !== fileName) await rm(path.join(audioRoot, row.audioPath), { force: true });
  await db.update(libraryPractice).set({ audioPath: fileName }).where(eq(libraryPractice.id, row.id));
  return libraryCatalog();
}

export async function readPracticeAudio(id: string): Promise<{ data: Buffer; type: string } | null> {
  const [row] = await db.select().from(libraryPractice).where(eq(libraryPractice.id, id)).limit(1);
  if (!row?.audioPath) return null;
  const full = path.resolve(audioRoot, row.audioPath);
  if (full !== path.join(audioRoot, row.audioPath)) return null;
  try {
    const data = await readFile(full);
    const type = row.audioPath.endsWith(".wav")
      ? "audio/wav"
      : row.audioPath.endsWith(".webm")
        ? "audio/webm"
        : row.audioPath.endsWith(".m4a")
          ? "audio/mp4"
          : "audio/mpeg";
    return { data, type };
  } catch {
    return null;
  }
}
