"use client";

import { BookOpen, Film, Headphones, PlayCircle } from "lucide-react";

import { ElementBadge, getElement } from "@/entities/element";
import type { ElementId } from "@/entities/element";
import {
  getLibraryBooks,
  getLibraryFilms,
  getLibraryMeditations,
  getLibraryVideos,
} from "@/entities/library";
import { routes } from "@/shared/config/routes";
import { Logo } from "@/shared/ui/logo";

function ElementTag({ elementId }: { elementId?: ElementId }) {
  if (!elementId) return null;
  return <ElementBadge element={getElement(elementId)} className="shrink-0" />;
}

function MediaRow({
  icon: Icon,
  title,
  meta,
  elementId,
}: {
  icon: typeof PlayCircle;
  title: string;
  meta: string;
  elementId?: ElementId;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium leading-snug">{title}</p>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-muted-foreground">{meta}</p>
          <ElementTag elementId={elementId} />
        </div>
      </div>
    </li>
  );
}

export function LibraryPage() {
  const videos = getLibraryVideos();
  const meditations = getLibraryMeditations();
  const books = getLibraryBooks();
  const films = getLibraryFilms();

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pt-6 pb-8">
      <header className="space-y-4">
        <Logo href={routes.program} />
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Библиотека</h1>
          <p className="text-sm text-muted-foreground">
            Видео, медитации, книги и фильмы — только то, что уже добавлено. У материала может
            быть своя стихия, это не отдельные «полки».
          </p>
        </div>
      </header>

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
              elementId={v.elementId}
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
              elementId={m.elementId}
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
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-1">
              <span>
                {b.title} <span className="text-muted-foreground">— {b.author}</span>
              </span>
              <ElementTag elementId={b.elementId} />
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
            <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-1">
              <span>
                {f.title} <span className="text-muted-foreground">({f.year})</span>
              </span>
              <ElementTag elementId={f.elementId} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
