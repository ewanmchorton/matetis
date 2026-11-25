"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookOpen, ChevronRight, Headphones, Play, Video } from "lucide-react";

import { currentElementId, getElement, getElementGuide } from "@/entities/element";
import { formatLabel, readableBooks } from "@/entities/library/model/readable-books";
import { request } from "@/shared/api/request";
import { isStaticPrototype } from "@/shared/config/env";
import { typograph } from "@/shared/lib/typograph";
import { cn } from "@/shared/lib/utils";
import { BackButton } from "@/shared/ui/back-button";
import { GlassCard } from "@/shared/ui/glass-card";
import { ScreenLayout, backgroundSrc } from "@/widgets/screen-layout";
import { AudioPlayer } from "@/views/practice/ui/audio-player";

import { readMarks, type ReaderMark } from "./reader-marks";
import { writePlace } from "./reader-place";
import { ReaderScreen } from "./reader-screen";

type LibraryCatalog = {
  elements: {
    id: string;
    videoUrl: string | null;
    body: string;
    books: { id: string; title: string; author: string | null; coverUrl: string | null }[];
    films: { id: string; title: string; year: number | null; coverUrl: string | null }[];
  }[];
  practices: { id: string; title: string; kind: "video" | "audio"; body: string; videoUrl: string | null; hasAudio: boolean }[];
  books: { id: string; coverUrl: string | null }[];
};
const libraryPractices = [
  { title: "Золотая подушечка", kind: "audio" as const },
  { title: "Техника Золотого Шара", kind: "audio" as const },
  { title: "Приветственное видео", kind: "video" as const },
];

const kindLabel = { audio: "Аудио", video: "Видео" };

/** Фон экрана практики – фон текущей стихии. Сейчас идёт Вода, поэтому берём её экран. */
const practiceBackground = currentElementId === "water" ? "11_water" : "04_earth_04_practice";

/** Рекомендации внутри стихии: только обложки, читалка отсюда не открывается. */
const waterRecommendations = {
  books: [
    { title: "Дао дэ цзин", author: "Лао-цзы", imageSrc: null },
    { title: "Цигун для начинающих", author: "Мантак Чиа", imageSrc: null },
  ],
  films: [{ title: "Весна, лето, осень, зима… и снова весна", imageSrc: null }],
};

/** На заглавной видно столько строк. Остальные открываются отдельной страницей и листаются вниз. */
const homePreview = 3;

type View =
  | { name: "home" }
  | { name: "element" }
  | { name: "practices" }
  | { name: "books" }
  | { name: "bookmarks" }
  | { name: "practice"; title: string; back: "home" | "practices" }
  | { name: "reader"; id: string };

/** Абзацы и строки, которые начинаются с «•», – списком. */
function Prose({ text }: { text: string }) {
  return (
    <div className="space-y-4">
      {text.split("\n\n").map((block) => {
        const lines = block.split("\n");
        if (lines.every((line) => line.startsWith("• "))) {
          return (
            <ul key={block} className="list-disc space-y-1 pl-5 type-body text-foreground">
              {lines.map((line) => (
                <li key={line}>{typograph(line.slice(2))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={block} className="type-body text-foreground">
            {typograph(block)}
          </p>
        );
      })}
    </div>
  );
}

function Cover({ title, note, imageSrc }: { title: string; note?: string; imageSrc?: string | null }) {
  return (
    <div className="space-y-2">
      <div className="relative flex aspect-[2/3] items-end overflow-hidden rounded-2xl bg-primary/10 p-3">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="type-caption text-foreground">{typograph(title)}</span>
        )}
      </div>
      {imageSrc && <p className="type-caption text-foreground">{typograph(title)}</p>}
      {note && <p className="type-caption text-muted-foreground">{note}</p>}
    </div>
  );
}

/** Заголовок раздела прямо на картинке: мягкий светлый овал, чтобы строка читалась. */
function PictureHeading({ children }: { children: string }) {
  return (
    <h2 className="relative z-0 w-fit type-section text-foreground">
      <span
        aria-hidden
        className="absolute top-1/2 left-1/2 -z-10 h-[160%] w-[calc(100%+32px)] -translate-x-1/2 -translate-y-1/2 rounded-[50%]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgb(250 247 242 / 0.65) 0%, rgb(250 247 242 / 0) 72%)",
        }}
      />
      {children}
    </h2>
  );
}

function RowIcon({ kind }: { kind: "audio" | "video" | "book" | "mark" }) {
  const Icon = kind === "audio" ? Headphones : kind === "video" ? Video : kind === "mark" ? Bookmark : BookOpen;
  return <Icon className="size-6 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />;
}

/** Строка списка на заглавной и на страницах «Все практики» и «Все книги». */
function LibraryRow({
  icon,
  title,
  meta,
  imageSrc,
  onClick,
}: {
  icon?: "audio" | "video" | "book" | "mark";
  title: string;
  meta?: string;
  imageSrc?: string | null;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-14 w-full items-center gap-3 px-5 py-3 text-left">
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageSrc} alt="" className="size-10 shrink-0 rounded-md object-cover" />
      ) : (
        icon && <RowIcon kind={icon} />
      )}
      <span className="min-w-0 flex-1">
        <span className={cn("block type-block", icon ? "text-foreground" : "text-primary")}>{typograph(title)}</span>
        {meta && <span className="block type-caption text-muted-foreground">{typograph(meta)}</span>}
      </span>
      <ChevronRight className={cn("size-5 shrink-0", icon ? "text-muted-foreground" : "text-primary")} aria-hidden />
    </button>
  );
}

function LibraryHome({
  onElement,
  onPractice,
  onAllPractices,
  onBook,
  onAllBooks,
  practices = libraryPractices,
  bookCovers = {},
}: {
  onElement: () => void;
  onPractice: (title: string) => void;
  onAllPractices: () => void;
  onBook: (id: string) => void;
  onAllBooks: () => void;
  practices?: { title: string; kind: "audio" | "video" }[];
  bookCovers?: Record<string, string>;
}) {
  const element = getElement(currentElementId);

  return (
    <ScreenLayout variant="page" background="11_library" title="Библиотека">
      <GlassCard className="p-5">
        <button type="button" className="block w-full text-left" onClick={onElement}>
          <span className="block type-section text-foreground">Стихия {element.genitive}</span>
          <span className="mt-2 block type-secondary text-muted-foreground">{element.period}</span>
          <span className="relative mt-4 block aspect-video overflow-hidden rounded-2xl">
            <img
              src={backgroundSrc("11_library")}
              alt=""
              className="size-full object-cover object-[center_12%]"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-background/85 text-primary shadow-[0_2px_8px_rgb(41_44_40/0.12)]">
                <Play className="size-5 fill-current" aria-hidden />
              </span>
            </span>
            <span className="absolute bottom-3 left-3 rounded-lg bg-background/85 px-2.5 py-1 type-caption text-foreground">
              Видео
            </span>
          </span>
        </button>
      </GlassCard>

      <section className="space-y-3" aria-label="Практики">
        <PictureHeading>Практики</PictureHeading>
        <GlassCard className="divide-y divide-foreground/10 p-0">
          {practices.slice(0, homePreview).map((practice) => (
            <LibraryRow
              key={practice.title}
              icon={practice.kind}
              title={practice.title}
              meta={kindLabel[practice.kind]}
              onClick={() => onPractice(practice.title)}
            />
          ))}
          <LibraryRow title="Все практики" onClick={onAllPractices} />
        </GlassCard>
      </section>

      <section className="space-y-3" aria-label="Книги">
        <PictureHeading>Книги</PictureHeading>
        <GlassCard className="divide-y divide-foreground/10 p-0">
          {readableBooks.slice(0, homePreview).map((book) => (
            <LibraryRow
              key={book.id}
              icon="book"
              title={book.title}
              meta={`${book.author} – ${formatLabel[book.format]}`}
              imageSrc={bookCovers[book.id]}
              onClick={() => onBook(book.id)}
            />
          ))}
          <LibraryRow title="Все книги" onClick={onAllBooks} />
        </GlassCard>
      </section>
    </ScreenLayout>
  );
}

function ElementScreen({ onBack, page }: { onBack: () => void; page?: LibraryCatalog["elements"][number] | null }) {
  const element = getElement(currentElementId);
  const guide = getElementGuide(currentElementId);
  const covers = page && (page.books.length > 0 || page.films.length > 0)
    ? {
        books: page.books.map((book) => ({ title: book.title, author: book.author ?? "", imageSrc: book.coverUrl })),
        films: page.films.map((film) => ({ title: film.title, imageSrc: film.coverUrl })),
      }
    : currentElementId === "water"
      ? waterRecommendations
      : { books: [], films: [] };
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    request<{ main: { url: string } | null }>("/api/element-images")
      .then((pictures) => setImageSrc(pictures.main?.url ?? null))
      .catch(() => setImageSrc(null));
  }, []);

  return (
    <ScreenLayout
      variant="page"
      background="11_water"
      imageSrc={imageSrc}
      title={`Стихия ${element.genitive}`}
      subtitle={element.period}
      clearNav
      actions={<BackButton onClick={onBack} />}
    >
      <GlassCard className="space-y-3">
        <p className="type-caption text-muted-foreground">Видео</p>
        <div className="flex aspect-video items-center justify-center rounded-2xl bg-foreground/5">
          <span className="type-secondary text-muted-foreground">
            {guide?.videoTitle ?? `Видео по стихии ${element.genitive}`}
          </span>
        </div>
      </GlassCard>
      <GlassCard>
        {page?.body ? (
          <Prose text={page.body} />
        ) : guide ? (
          <Prose text={guide.text} />
        ) : (
          <p className="type-body text-muted-foreground">Описание появится, когда его добавят.</p>
        )}
      </GlassCard>
      <section className="space-y-3" aria-label="Книги">
        <h2 className="type-section text-foreground">Книги</h2>
        <ul className="grid grid-cols-2 gap-4">
          {covers.books.map((book) => (
            <li key={book.title}>
              <Cover title={book.title} note={book.author} imageSrc={book.imageSrc} />
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-3" aria-label="Фильмы">
        <h2 className="type-section text-foreground">Фильмы</h2>
        <ul className="grid grid-cols-2 gap-4">
          {covers.films.map((film) => (
            <li key={film.title}>
              <Cover title={film.title} imageSrc={film.imageSrc} />
            </li>
          ))}
        </ul>
      </section>
    </ScreenLayout>
  );
}

function PracticeScreen({
  title,
  body,
  kind,
  onBack,
}: {
  title: string;
  body?: string;
  kind?: "audio" | "video";
  onBack: () => void;
}) {
  const practice = libraryPractices.find((item) => item.title === title);
  const video = (kind ?? practice?.kind) === "video";

  return (
    <ScreenLayout
      variant="page"
      background={practiceBackground}
      beforeTitle={<p className="type-caption text-muted-foreground">{video ? "Видео" : "Аудио"}</p>}
      title={title}
      clearNav
      actions={<BackButton onClick={onBack} />}
    >
      {video ? (
        <GlassCard className="flex aspect-video items-center justify-center bg-background/80">
          <span className="type-secondary text-muted-foreground">Видео</span>
        </GlassCard>
      ) : (
        <AudioPlayer durationSeconds={5 * 60} />
      )}
      <GlassCard className="bg-background/80">
        <p className="type-body text-foreground">{body ? typograph(body) : "Текст практики появится, когда его добавят."}</p>
      </GlassCard>
    </ScreenLayout>
  );
}

function PracticeList({
  practices = libraryPractices,
  onBack,
  onOpen,
}: {
  practices?: { title: string; kind: "audio" | "video" }[];
  onBack: () => void;
  onOpen: (title: string) => void;
}) {
  return (
    <ScreenLayout
      variant="page"
      background={practiceBackground}
      title="Практики"
      clearNav
      actions={<BackButton onClick={onBack} />}
    >
      <GlassCard className="divide-y divide-foreground/10 p-0">
        {practices.map((practice) => (
          <LibraryRow
            key={practice.title}
            icon={practice.kind}
            title={practice.title}
            meta={kindLabel[practice.kind]}
            onClick={() => onOpen(practice.title)}
          />
        ))}
      </GlassCard>
    </ScreenLayout>
  );
}

function savedMarks() {
  return readableBooks.flatMap((book) =>
    [...readMarks(book.id)].reverse().map((mark) => ({ book, mark })),
  );
}

function markLabel(format: (typeof readableBooks)[number]["format"], mark: ReaderMark) {
  const name = format === "epub" || format === "fb2" ? "Лист" : "Страница";
  return `${name} ${mark.page}`;
}

function BookList({
  onBack,
  onOpen,
  onBookmarks,
  bookCovers = {},
}: {
  onBack: () => void;
  onOpen: (id: string) => void;
  onBookmarks: () => void;
  bookCovers?: Record<string, string>;
}) {
  return (
    <ScreenLayout
      variant="page"
      background="11_books"
      title="Книги"
      clearNav
      headerAction={
        <button
          type="button"
          aria-label="Закладки"
          onClick={onBookmarks}
          className="grid size-11 shrink-0 place-items-center rounded-full text-primary"
        >
          <Bookmark className="size-6" strokeWidth={1.75} aria-hidden />
        </button>
      }
      actions={<BackButton onClick={onBack} />}
    >
      <GlassCard className="divide-y divide-foreground/10 p-0">
        {readableBooks.map((book) => (
          <LibraryRow
            key={book.id}
            icon="book"
            title={book.title}
            meta={`${book.author} – ${formatLabel[book.format]}`}
            imageSrc={bookCovers[book.id]}
            onClick={() => onOpen(book.id)}
          />
        ))}
      </GlassCard>
    </ScreenLayout>
  );
}

function BookmarkScreen({ onBack, onOpen }: { onBack: () => void; onOpen: (id: string, mark: ReaderMark) => void }) {
  const [marks, setMarks] = useState<ReturnType<typeof savedMarks>>([]);

  useEffect(() => {
    setMarks(savedMarks());
  }, []);

  return (
    <ScreenLayout
      variant="page"
      background="11_books"
      title="Закладки"
      clearNav
      actions={<BackButton onClick={onBack} />}
    >
      {marks.length === 0 ? (
        <GlassCard>
          <p className="type-body text-foreground">Закладок пока нет. Поставьте закладку в книге, и она появится здесь.</p>
        </GlassCard>
      ) : (
        <GlassCard className="divide-y divide-foreground/10 p-0">
          {marks.map(({ book, mark }) => (
            <LibraryRow
              key={`${book.id}-${mark.slice}-${mark.page}`}
              icon="mark"
              title={book.title}
              meta={markLabel(book.format, mark)}
              onClick={() => onOpen(book.id, mark)}
            />
          ))}
        </GlassCard>
      )}
    </ScreenLayout>
  );
}

/** Заглавная – список. Читалка открывается из раздела «Книги». */
export function LibraryPage() {
  const [view, setView] = useState<View>({ name: "home" });
  const [catalog, setCatalog] = useState<LibraryCatalog | null>(null);

  useEffect(() => {
    if (isStaticPrototype) return;
    request<LibraryCatalog>("/api/library/catalog")
      .then(setCatalog)
      .catch(() => setCatalog(null));
  }, []);

  const practices = catalog?.practices.length
    ? catalog.practices.map((practice) => ({ title: practice.title, kind: practice.kind, body: practice.body }))
    : libraryPractices.map((practice) => ({ ...practice, body: "" }));
  const elementPage = catalog?.elements.find((item) => item.id === currentElementId) ?? null;
  const bookCovers = Object.fromEntries(
    (catalog?.books ?? []).flatMap((book) => (book.coverUrl ? [[book.id, book.coverUrl] as const] : [])),
  );

  if (view.name === "reader") {
    const book = readableBooks.find((item) => item.id === view.id);
    if (!book) return null;
    return <ReaderScreen book={book} onBack={() => setView({ name: "books" })} />;
  }
  if (view.name === "element") return <ElementScreen page={elementPage} onBack={() => setView({ name: "home" })} />;
  if (view.name === "practices") {
    return (
      <PracticeList
        practices={practices}
        onBack={() => setView({ name: "home" })}
        onOpen={(title) => setView({ name: "practice", title, back: "practices" })}
      />
    );
  }
  if (view.name === "books") {
    return (
      <BookList
        onBack={() => setView({ name: "home" })}
        onOpen={(id) => setView({ name: "reader", id })}
        onBookmarks={() => setView({ name: "bookmarks" })}
        bookCovers={bookCovers}
      />
    );
  }
  if (view.name === "bookmarks") {
    return (
      <BookmarkScreen
        onBack={() => setView({ name: "books" })}
        onOpen={(id, mark) => {
          writePlace(id, mark);
          setView({ name: "reader", id });
        }}
      />
    );
  }
  if (view.name === "practice") {
    const back = view.back;
    return (
      <PracticeScreen
        title={view.title}
        body={practices.find((practice) => practice.title === view.title)?.body}
        kind={practices.find((practice) => practice.title === view.title)?.kind}
        onBack={() => setView(back === "practices" ? { name: "practices" } : { name: "home" })}
      />
    );
  }

  return (
    <LibraryHome
      onElement={() => setView({ name: "element" })}
      onPractice={(title) => setView({ name: "practice", title, back: "home" })}
      onAllPractices={() => setView({ name: "practices" })}
      onBook={(id) => setView({ name: "reader", id })}
      onAllBooks={() => setView({ name: "books" })}
      practices={practices}
      bookCovers={bookCovers}
    />
  );
}
