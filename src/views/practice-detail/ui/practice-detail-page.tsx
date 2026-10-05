import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";

import { ElementBadge, getElement } from "@/entities/element";
import { practiceKindLabel, type Practice } from "@/entities/practice";
import { MarkDoneButton } from "@/features/mark-practice-done";
import { routes } from "@/shared/config/routes";
import { ImagePlaceholder, VideoPlaceholder } from "@/shared/ui/media-placeholder";

export function PracticeDetailPage({ practice }: { practice: Practice }) {
  const backHref = practice.kind === "state" ? routes.library.practices : routes.program.home;

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {practice.kind === "state" ? "Библиотека" : "Программа"}
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium uppercase tracking-wider">
            {practiceKindLabel[practice.kind]}
          </span>
          {practice.elementId && <ElementBadge element={getElement(practice.elementId)} />}
          {practice.state && (
            <span className="rounded-full bg-muted px-2.5 py-0.5">{practice.state}</span>
          )}
        </div>
        <h1 className="text-3xl font-semibold leading-tight">{practice.title}</h1>
        <p className="text-lg text-muted-foreground">{practice.summary}</p>
        <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-4" />
          {practice.durationMin} минут
          {practice.weekday && ` · рекомендуемый день: ${practice.weekday.toLowerCase()}`}
        </p>
      </header>

      {practice.video && (
        <VideoPlaceholder title={practice.video.title} duration={practice.video.duration} />
      )}
      {!practice.video && practice.hasImage && <ImagePlaceholder />}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Как выполнять</h2>
        <ol className="space-y-3">
          {practice.steps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-sm font-medium">
                {i + 1}
              </span>
              <p className="pt-0.5 leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {practice.video && practice.hasImage && <ImagePlaceholder />}

      <div className="sticky bottom-20 rounded-2xl border bg-background/95 p-3 shadow-sm backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none">
        <MarkDoneButton practiceId={practice.id} kind={practice.kind} />
      </div>
    </article>
  );
}
