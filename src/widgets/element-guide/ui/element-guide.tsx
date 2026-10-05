import { BookOpen, Film } from "lucide-react";

import { getCurrentElement, getElementGuide } from "@/entities/element";
import { VideoPlaceholder } from "@/shared/ui/media-placeholder";

export function ElementGuide() {
  const element = getCurrentElement();
  const guide = getElementGuide(element.id);

  if (!guide) {
    return (
      <section className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
        Рекомендации на стихию «{element.name}» появятся позже.
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Рекомендации на стихию</h2>
      <div className="grid gap-4 rounded-2xl border bg-card p-4 sm:p-5 md:grid-cols-2">
        <VideoPlaceholder title={guide.videoTitle} duration={guide.videoDuration} />
        <div className="space-y-4">
          <div className="space-y-1.5">
            <h3 className="font-semibold">{guide.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{guide.text}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
            <div className="space-y-2">
              <p className="inline-flex items-center gap-1.5 text-sm font-medium">
                <BookOpen className="size-4" /> Книги
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {guide.books.map((b) => (
                  <li key={b.title}>
                    «{b.title}» — {b.author}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <p className="inline-flex items-center gap-1.5 text-sm font-medium">
                <Film className="size-4" /> Фильмы
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {guide.films.map((f) => (
                  <li key={f.title}>
                    «{f.title}», {f.year}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
