"use client";

import Link from "next/link";
import { CheckCircle2, Clock, PlayCircle } from "lucide-react";

import { getCurrentElement } from "@/entities/element";
import { currentElementDay, getProgram, getTodayPractice } from "@/entities/practice";
import { useProgress } from "@/entities/progress";
import { routes } from "@/shared/config/routes";
import { buttonVariants } from "@/shared/ui/button";
import { ImagePlaceholder } from "@/shared/ui/media-placeholder";

export function TodayPractice() {
  const { typeId, completedPracticeIds } = useProgress();
  const element = getCurrentElement();
  const { daily } = getProgram(typeId ?? "t1", element.id);
  const practice = getTodayPractice(daily);

  if (!practice) {
    return (
      <section className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        На сегодня практик нет. Мастер скоро добавит новые.
      </section>
    );
  }

  const done = completedPracticeIds.includes(practice.id);

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="grid gap-0 md:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>Практика на сегодня</span>
            <span>День {currentElementDay}</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight sm:text-2xl">{practice.title}</h2>
            <p className="text-muted-foreground">{practice.summary}</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" />
              {practice.durationMin} мин
            </span>
            {practice.video && (
              <span className="inline-flex items-center gap-1.5">
                <PlayCircle className="size-4" />
                есть видео
              </span>
            )}
          </div>
          <div className="mt-auto flex flex-wrap items-center gap-3">
            <Link
              href={routes.practice(practice.id)}
              className={buttonVariants({ size: "lg", className: "h-11 px-5 text-base" })}
            >
              {done ? "Открыть ещё раз" : "Начать практику"}
            </Link>
            {done && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                <CheckCircle2 className="size-4" />
                Выполнено сегодня
              </span>
            )}
          </div>
        </div>
        <ImagePlaceholder className="hidden h-full rounded-none md:flex md:aspect-auto" />
      </div>
    </section>
  );
}
