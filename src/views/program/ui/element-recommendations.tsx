"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronRight, Film, PlayCircle } from "lucide-react";

import type { Element, ElementGuide } from "@/entities/element";
import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";

function GuideDetail({ guide, onClose }: { guide: ElementGuide; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 mx-auto flex w-full max-w-[390px] flex-col bg-background">
      <div className="flex items-center gap-2 px-3 pt-4">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft />
          Назад
        </Button>
      </div>
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pt-2 pb-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold leading-tight">{guide.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{guide.text}</p>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <PlayCircle className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-snug">{guide.videoTitle}</p>
            <p className="text-xs text-muted-foreground">Видео · {guide.videoDuration}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-medium">
            <BookOpen className="size-4 text-primary" />
            Книги
          </p>
          <ul className="space-y-1 text-sm">
            {guide.books.map((book) => (
              <li key={book.title}>
                {book.title} <span className="text-muted-foreground">— {book.author}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Film className="size-4 text-primary" />
            Фильмы
          </p>
          <ul className="space-y-1 text-sm">
            {guide.films.map((film) => (
              <li key={film.title}>
                {film.title} <span className="text-muted-foreground">({film.year})</span>
              </li>
            ))}
          </ul>
        </div>

        <Link href={routes.library} className="text-sm font-medium text-primary hover:underline">
          Вся библиотека по стихии →
        </Link>
      </div>
    </div>
  );
}

export function ElementRecommendations({
  element,
  guide,
}: {
  element: Element;
  guide: ElementGuide | undefined;
}) {
  const [open, setOpen] = useState(false);

  if (!guide) {
    return (
      <section aria-labelledby="recommendations-title" className="space-y-3">
        <h2 id="recommendations-title" className="text-lg font-semibold">
          Рекомендации стихии
        </h2>
        <p className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
          Рекомендации для стихии {element.name} появятся позже — загляните в библиотеку.
        </p>
      </section>
    );
  }

  return (
    <>
      <section aria-labelledby="recommendations-title" className="space-y-3">
        <h2 id="recommendations-title" className="text-lg font-semibold">
          Рекомендации стихии
        </h2>
        <button
          type="button"
          className="w-full space-y-3 rounded-2xl border bg-card p-4 text-left"
          onClick={() => setOpen(true)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="font-medium">{guide.title}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{guide.summary}</p>
            </div>
            <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <PlayCircle className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug">{guide.videoTitle}</p>
              <p className="text-xs text-muted-foreground">Видео · {guide.videoDuration}</p>
            </div>
          </div>
        </button>
      </section>
      {open && <GuideDetail guide={guide} onClose={() => setOpen(false)} />}
    </>
  );
}
