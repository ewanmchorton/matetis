"use client";

import { useState } from "react";

import { currentElementId, getElement, getElementGuide } from "@/entities/element";
import { typograph } from "@/shared/lib/typograph";
import { Button } from "@/shared/ui/button";
import { GlassCard } from "@/shared/ui/glass-card";
import { ScreenLayout } from "@/widgets/screen-layout";

/** Редкие практики. На заглавной – только название, текст открывается внутри. */
const libraryPractices = [
  { title: "Золотая подушечка", meta: "Запись" },
  { title: "Техника Золотого Шара", meta: "Запись" },
  { title: "Приветственное видео", meta: "Видео" },
];

/** Рекомендации внутри стихии: только обложки, читалка отсюда не открывается. */
const waterRecommendations = {
  books: [
    { title: "Дао дэ цзин", author: "Лао-цзы" },
    { title: "Цигун для начинающих", author: "Мантак Чиа" },
  ],
  films: [{ title: "Весна, лето, осень, зима… и снова весна" }],
};

/** Книги, которые можно читать. Раздел на заглавной, не внутри стихии. */
const readableBooks = [{ title: "Цигун для начинающих", author: "Мантак Чиа" }];

/** На заглавной видно столько строк. Остальные открываются отдельной страницей и листаются вниз. */
const homePreview = 3;

type View =
  | { name: "home" }
  | { name: "element" }
  | { name: "practices" }
  | { name: "books" }
  | { name: "practice"; title: string; back: "home" | "practices" }
  | { name: "reader"; title: string; back: "home" | "books" };

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

function Cover({ title, note }: { title: string; note?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex aspect-[2/3] items-end rounded-2xl bg-primary/10 p-3">
        <span className="type-caption text-foreground">{typograph(title)}</span>
      </div>
      {note && <p className="type-caption text-muted-foreground">{note}</p>}
    </div>
  );
}

function Back({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button variant="ghost" className="self-start px-0" onClick={onClick}>
      {label}
    </Button>
  );
}

function LibraryHome({
  onElement,
  onPractice,
  onAllPractices,
  onBook,
  onAllBooks,
}: {
  onElement: () => void;
  onPractice: (title: string) => void;
  onAllPractices: () => void;
  onBook: (title: string) => void;
  onAllBooks: () => void;
}) {
  const element = getElement(currentElementId);

  return (
    <ScreenLayout variant="page" title="Библиотека">
      <GlassCard className="space-y-3 p-0">
        <button type="button" className="block w-full space-y-3 p-5 text-left" onClick={onElement}>
          <span className="flex aspect-video items-end rounded-2xl bg-foreground/5 p-4">
            <span className="type-caption text-muted-foreground">Видео</span>
          </span>
          <span className="block">
            <span className="block type-section text-foreground">Стихия {element.genitive}</span>
            <span className="block type-caption text-muted-foreground">{element.period}</span>
          </span>
        </button>
      </GlassCard>

      <section className="space-y-3" aria-label="Практики">
        <h2 className="type-section text-foreground">Практики</h2>
        <GlassCard className="divide-y divide-foreground/8 px-5 py-1">
          {libraryPractices.slice(0, homePreview).map((practice) => (
            <button
              key={practice.title}
              type="button"
              className="flex w-full items-center justify-between gap-3 py-3 text-left"
              onClick={() => onPractice(practice.title)}
            >
              <span className="type-block text-foreground">{practice.title}</span>
              <span className="type-caption text-muted-foreground">{practice.meta}</span>
            </button>
          ))}
          {libraryPractices.length > homePreview && (
            <button type="button" className="w-full py-3 text-left type-caption text-primary" onClick={onAllPractices}>
              Все практики
            </button>
          )}
        </GlassCard>
      </section>

      <section className="space-y-3" aria-label="Книги">
        <h2 className="type-section text-foreground">Книги</h2>
        <GlassCard className="divide-y divide-foreground/8 px-5 py-1">
          {readableBooks.slice(0, homePreview).map((book) => (
            <button
              key={book.title}
              type="button"
              className="flex w-full items-center justify-between gap-3 py-3 text-left"
              onClick={() => onBook(book.title)}
            >
              <span className="min-w-0">
                <span className="block type-block text-foreground">{book.title}</span>
                <span className="block type-caption text-muted-foreground">{book.author}</span>
              </span>
              <span className="type-caption text-primary">Читать</span>
            </button>
          ))}
          {readableBooks.length > homePreview && (
            <button type="button" className="w-full py-3 text-left type-caption text-primary" onClick={onAllBooks}>
              Все книги
            </button>
          )}
        </GlassCard>
      </section>
    </ScreenLayout>
  );
}

function ElementScreen({ onBack }: { onBack: () => void }) {
  const element = getElement(currentElementId);
  const guide = getElementGuide(currentElementId);
  const covers = currentElementId === "water" ? waterRecommendations : { books: [], films: [] };

  return (
    <ScreenLayout variant="page" title={`Стихия ${element.genitive}`} subtitle={element.period}>
      <Back onClick={onBack} label="К библиотеке" />
      <GlassCard className="space-y-3">
        <p className="type-caption text-muted-foreground">Видео</p>
        <div className="flex aspect-video items-center justify-center rounded-2xl bg-foreground/5">
          <span className="type-secondary text-muted-foreground">
            {guide?.videoTitle ?? `Видео по стихии ${element.genitive}`}
          </span>
        </div>
      </GlassCard>
      <GlassCard>
        {guide ? (
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
              <Cover title={book.title} note={book.author} />
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-3" aria-label="Фильмы">
        <h2 className="type-section text-foreground">Фильмы</h2>
        <ul className="grid grid-cols-2 gap-4">
          {covers.films.map((film) => (
            <li key={film.title}>
              <Cover title={film.title} />
            </li>
          ))}
        </ul>
      </section>
    </ScreenLayout>
  );
}

function PracticeScreen({ title, onBack }: { title: string; onBack: () => void }) {
  const practice = libraryPractices.find((item) => item.title === title);

  return (
    <ScreenLayout variant="page" title={title} subtitle={practice?.meta}>
      <Back onClick={onBack} label="К библиотеке" />
      <GlassCard className="flex aspect-video items-center justify-center">
        <span className="type-secondary text-muted-foreground">{practice?.meta === "Видео" ? "Видео" : "Аудио"}</span>
      </GlassCard>
      <GlassCard>
        <p className="type-body text-muted-foreground">[Текст практики]</p>
      </GlassCard>
    </ScreenLayout>
  );
}

function ReaderScreen({ title, onBack }: { title: string; onBack: () => void }) {
  const [mode, setMode] = useState<"page" | "scroll">("page");
  const [page, setPage] = useState(1);
  const pages = 12;

  return (
    <ScreenLayout variant="page" title={title} subtitle={mode === "page" ? `Страница ${page} из ${pages}` : "Прокрутка"}>
      <Back onClick={onBack} label="К библиотеке" />
      <div className="flex gap-2">
        <Button variant={mode === "page" ? "default" : "outline"} onClick={() => setMode("page")}>
          Листание
        </Button>
        <Button variant={mode === "scroll" ? "default" : "outline"} onClick={() => setMode("scroll")}>
          Прокрутка
        </Button>
      </div>
      {mode === "page" ? (
        <button
          type="button"
          className="flex min-h-80 items-center justify-center rounded-3xl bg-background/80 text-center"
          onClick={() => setPage((current) => (current === pages ? 1 : current + 1))}
        >
          <span className="type-body text-muted-foreground">Нажмите, чтобы перелистнуть</span>
        </button>
      ) : (
        <div className="space-y-3">
          {[1, 2, 3].map((number) => (
            <div key={number} className="flex min-h-48 items-center justify-center rounded-3xl bg-background/80">
              <span className="type-caption text-muted-foreground">Страница {number}</span>
            </div>
          ))}
        </div>
      )}
    </ScreenLayout>
  );
}

/** Заглавная – список. Читалка открывается из раздела «Книги». */
export function LibraryPage() {
  const [view, setView] = useState<View>({ name: "home" });

  if (view.name === "reader") {
    const back = view.back;
    return (
      <ReaderScreen
        title={view.title}
        onBack={() => setView(back === "books" ? { name: "books" } : { name: "home" })}
      />
    );
  }
  if (view.name === "element") return <ElementScreen onBack={() => setView({ name: "home" })} />;
  if (view.name === "practices") {
    return (
      <ScreenLayout variant="page" title="Практики">
        <Back onClick={() => setView({ name: "home" })} label="К библиотеке" />
        <GlassCard className="divide-y divide-foreground/8 px-5 py-1">
          {libraryPractices.map((practice) => (
            <button
              key={practice.title}
              type="button"
              className="flex w-full items-center justify-between gap-3 py-3 text-left"
              onClick={() => setView({ name: "practice", title: practice.title, back: "practices" })}
            >
              <span className="type-block text-foreground">{practice.title}</span>
              <span className="type-caption text-muted-foreground">{practice.meta}</span>
            </button>
          ))}
        </GlassCard>
      </ScreenLayout>
    );
  }
  if (view.name === "books") {
    return (
      <ScreenLayout variant="page" title="Книги">
        <Back onClick={() => setView({ name: "home" })} label="К библиотеке" />
        <GlassCard className="divide-y divide-foreground/8 px-5 py-1">
          {readableBooks.map((book) => (
            <button
              key={book.title}
              type="button"
              className="flex w-full items-center justify-between gap-3 py-3 text-left"
              onClick={() => setView({ name: "reader", title: book.title, back: "books" })}
            >
              <span className="min-w-0">
                <span className="block type-block text-foreground">{book.title}</span>
                <span className="block type-caption text-muted-foreground">{book.author}</span>
              </span>
              <span className="type-caption text-primary">Читать</span>
            </button>
          ))}
        </GlassCard>
      </ScreenLayout>
    );
  }
  if (view.name === "practice") {
    const back = view.back;
    return (
      <PracticeScreen
        title={view.title}
        onBack={() => setView(back === "practices" ? { name: "practices" } : { name: "home" })}
      />
    );
  }

  return (
    <LibraryHome
      onElement={() => setView({ name: "element" })}
      onPractice={(title) => setView({ name: "practice", title, back: "home" })}
      onAllPractices={() => setView({ name: "practices" })}
      onBook={(title) => setView({ name: "reader", title, back: "home" })}
      onAllBooks={() => setView({ name: "books" })}
    />
  );
}
