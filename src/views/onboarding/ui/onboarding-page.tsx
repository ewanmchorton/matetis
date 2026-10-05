"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CalendarCheck, Repeat, Sparkles } from "lucide-react";

import { ElementBadge, getCurrentElement, getElements } from "@/entities/element";
import { getPersonTypes } from "@/entities/person-type";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";

/** На первом экране онбординга показываем примеры, а не все 12 названий — на телефоне иначе тесно. */
const onboardingTypeExamples = [0, 2, 4, 6, 9, 11];

function SlideSystem() {
  const types = getPersonTypes();
  const examples = onboardingTypeExamples.map((i) => types[i]).filter(Boolean);
  const restCount = types.length - examples.length;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold leading-tight">Ваш путь развития в МАТЭТИС</h1>
      <p className="leading-relaxed text-muted-foreground">
        В системе 12 психотипов — у каждого своё имя и своя программа. Короткий тест определит
        ваш, и приложение соберёт практики именно для вас.
      </p>
      <div className="space-y-3 pt-2">
        <ul className="flex flex-wrap gap-2">
          {examples.map((type) => (
            <li
              key={type.id}
              className="rounded-full border bg-card px-3.5 py-1.5 text-sm font-medium"
            >
              {type.name}
            </li>
          ))}
          <li className="rounded-full bg-muted px-3.5 py-1.5 text-sm text-muted-foreground">
            и ещё {restCount}
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Примеры типов. Полный список откроется после теста — там будет ваш результат.
        </p>
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
  { icon: CalendarCheck, title: "Рекомендации стихии", text: "Видео, книги и фильмы в библиотеке" },
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
    <main className="flex flex-1 flex-col gap-8 px-5 py-8">
      <div className="flex items-center justify-between">
        <Logo href={routes.auth} />
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
