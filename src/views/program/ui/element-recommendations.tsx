import Link from "next/link";
import { BookOpen, Film, PlayCircle } from "lucide-react";

import type { Element, ElementGuide } from "@/entities/element";
import { routes } from "@/shared/config/routes";

export function ElementRecommendations({
  element,
  guide,
}: {
  element: Element;
  guide: ElementGuide | undefined;
}) {
  return (
    <section aria-labelledby="recommendations-title" className="space-y-3">
      <h2 id="recommendations-title" className="text-lg font-semibold">
        Рекомендации стихии
      </h2>
      {guide ? (
        <div className="space-y-4 rounded-2xl border bg-card p-4">
          <div className="space-y-1.5">
            <p className="font-medium">{guide.title}</p>
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
              {guide.books.map((b) => (
                <li key={b.title}>
                  {b.title} <span className="text-muted-foreground">— {b.author}</span>
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
              {guide.films.map((f) => (
                <li key={f.title}>
                  {f.title} <span className="text-muted-foreground">({f.year})</span>
                </li>
              ))}
            </ul>
          </div>
          <Link href={routes.library} className="text-sm font-medium text-primary hover:underline">
            Вся библиотека по стихии →
          </Link>
        </div>
      ) : (
        <p className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
          Рекомендации для стихии {element.name} появятся позже — загляните в библиотеку.
        </p>
      )}
    </section>
  );
}
