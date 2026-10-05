"use client";

import { BookOpen, Film, Headphones, Lock, PlayCircle } from "lucide-react";

import {
  ElementBadge,
  getCurrentElement,
  getElement,
  getElements,
} from "@/entities/element";
import {
  getLibraryBooksAndFilms,
  getLibraryMeditations,
  getLibraryVideos,
} from "@/entities/library";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Logo } from "@/shared/ui/logo";

function MediaRow({
  icon: Icon,
  title,
  meta,
}: {
  icon: typeof PlayCircle;
  title: string;
  meta: string;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium leading-snug">{title}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
    </li>
  );
}

export function LibraryPage() {
  const current = getCurrentElement();
  const videos = getLibraryVideos(current.id);
  const meditations = getLibraryMeditations(current.id);
  const { books, films, introText } = getLibraryBooksAndFilms(current.id);
  const allElements = getElements();

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pt-6 pb-8">
      <header className="space-y-4">
        <Logo href={routes.program} />
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Библиотека</h1>
          <p className="text-sm text-muted-foreground">
            Видео, медитации, книги и фильмы по стихиям. Сейчас открыта стихия{" "}
            <ElementBadge element={current} className="align-middle" />.
          </p>
        </div>
      </header>

      {introText && (
        <p className="rounded-2xl border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
          {introText}
        </p>
      )}

      <section className="space-y-3" aria-labelledby="lib-videos">
        <h2 id="lib-videos" className="text-lg font-semibold">
          Видео
        </h2>
        <ul className="space-y-2">
          {videos.map((v) => (
            <MediaRow
              key={v.id}
              icon={PlayCircle}
              title={v.title}
              meta={`Видео · ${v.duration}${v.kind === "intro" ? " · вводное" : ""}`}
            />
          ))}
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="lib-meditations">
        <h2 id="lib-meditations" className="text-lg font-semibold">
          Медитации
        </h2>
        <ul className="space-y-2">
          {meditations.map((m) => (
            <MediaRow
              key={m.id}
              icon={Headphones}
              title={m.title}
              meta={`Аудио · ${m.duration}`}
            />
          ))}
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="lib-books">
        <h2 id="lib-books" className="flex items-center gap-2 text-lg font-semibold">
          <BookOpen className="size-5 text-primary" />
          Книги
        </h2>
        <ul className="space-y-2 rounded-2xl border bg-card p-4 text-sm">
          {books.map((b) => (
            <li key={b.title}>
              {b.title} <span className="text-muted-foreground">— {b.author}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="lib-films">
        <h2 id="lib-films" className="flex items-center gap-2 text-lg font-semibold">
          <Film className="size-5 text-primary" />
          Фильмы
        </h2>
        <ul className="space-y-2 rounded-2xl border bg-card p-4 text-sm">
          {films.map((f) => (
            <li key={f.title}>
              {f.title} <span className="text-muted-foreground">({f.year})</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="lib-other">
        <h2 id="lib-other" className="text-lg font-semibold">
          Другие стихии
        </h2>
        <ul className="space-y-2">
          {allElements
            .filter((el) => el.id !== current.id)
            .map((el) => (
              <li
                key={el.id}
                className={cn(
                  "flex items-center justify-between rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground",
                )}
              >
                <div className="flex items-center gap-2">
                  <ElementBadge element={getElement(el.id)} />
                  <span>{el.season}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs">
                  <Lock className="size-3.5" />
                  позже
                </span>
              </li>
            ))}
        </ul>
      </section>
    </main>
  );
}
