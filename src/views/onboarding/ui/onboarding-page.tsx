"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CalendarCheck, Repeat, Sparkles } from "lucide-react";

import { ElementBadge, getCurrentElement, getElements } from "@/entities/element";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";

function SlideSystem() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold leading-tight">Ваш путь развития по системе Мастера</h1>
      <p className="leading-relaxed text-muted-foreground">
        В системе 12 психотипов людей. Короткий тест определит ваш, и приложение соберёт
        программу практик именно для вас.
      </p>
      <div className="grid grid-cols-4 gap-2 pt-2" aria-hidden>
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className={cn(
              "grid aspect-square place-items-center rounded-xl border bg-card text-sm text-muted-foreground",
              i === 6 && "border-primary bg-primary/10 font-semibold text-primary",
            )}
          >
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

function SlideElements() {
  const current = getCurrentElement();
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold leading-tight">Пять стихий — пять сезонов</h1>
      <p className="leading-relaxed text-muted-foreground">
        Стихии сменяются вместе со временем года, а с ними обновляется и ваша программа.
        Сейчас — стихия {current.name}.
      </p>
      <ul className="space-y-2 pt-2">
        {getElements().map((el) => (
          <li
            key={el.id}
            className={cn(
              "flex items-center justify-between rounded-xl border bg-card px-4 py-3",
              el.id === current.id && "border-primary ring-2 ring-primary/15",
            )}
          >
            <ElementBadge element={el} />
            <span className="text-sm text-muted-foreground">{el.season}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const programParts = [
  { icon: Sparkles, title: "Практика на сегодня", text: "Одно небольшое задание каждый день" },
  { icon: Repeat, title: "Ритуалы недели", text: "Зарядка, медитации — отмечайте галочкой" },
  { icon: CalendarCheck, title: "Рекомендации стихии", text: "Видео Мастера, книги и фильмы" },
];

function SlideProgram() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold leading-tight">Как устроена программа</h1>
      <ul className="space-y-3 pt-2">
        {programParts.map((p) => (
          <li key={p.title} className="flex gap-4 rounded-xl border bg-card p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <p.icon className="size-5" />
            </span>
            <div>
              <p className="font-medium">{p.title}</p>
              <p className="text-sm text-muted-foreground">{p.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const slides = [SlideSystem, SlideElements, SlideProgram];

export function OnboardingPage() {
  const [index, setIndex] = useState(0);
  const Slide = slides[index];
  const isLast = index === slides.length - 1;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-5 py-8 md:max-w-lg">
      <div className="flex items-center justify-between">
        <Logo href={routes.map} />
        {!isLast && (
          <Link href={routes.typeTest} className="text-sm text-muted-foreground hover:text-foreground">
            Пропустить
          </Link>
        )}
      </div>

      <Slide />

      <div className="mt-auto space-y-5">
        <div className="flex justify-center gap-2" aria-label={`Экран ${index + 1} из ${slides.length}`}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Перейти к экрану ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-2 rounded-full bg-muted-foreground/25 transition-all",
                i === index ? "w-6 bg-primary" : "w-2",
              )}
            />
          ))}
        </div>
        {isLast ? (
          <Link
            href={routes.typeTest}
            className={buttonVariants({ size: "lg", className: "h-12 w-full text-base" })}
          >
            Пройти тест
          </Link>
        ) : (
          <Button size="lg" className="h-12 w-full text-base" onClick={() => setIndex(index + 1)}>
            Дальше
            <ArrowRight />
          </Button>
        )}
      </div>
    </main>
  );
}
