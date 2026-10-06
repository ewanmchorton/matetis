"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CalendarCheck, Repeat, Sparkles } from "lucide-react";

import { ElementBadge, getCurrentElement, getElements } from "@/entities/element";
import { progressActions } from "@/entities/progress";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Logo } from "@/shared/ui/logo";

function SlideSystem() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold leading-tight">Ваш путь развития в МАТЭТИС</h1>
      <p className="leading-relaxed text-muted-foreground">
        Короткий тест определит ваш психотип. Мы покажем несколько характеристик — и сразу перейдём
        к практикам.
      </p>
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

function SlideBirth({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold leading-tight">Дата рождения</h1>
      <p className="leading-relaxed text-muted-foreground">
        По ней добавим несколько практик для стихии, которой полезно внимание. Они не заменят
        основную программу. Дату можно не указывать — тогда останется только она.
      </p>
      <div className="space-y-2 pt-2">
        <Label htmlFor="onboarding-birth">Дата</Label>
        <Input
          id="onboarding-birth"
          type="date"
          className="h-11"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <p className="text-sm text-muted-foreground">Как именно считать стихию по дате — ещё уточняем.</p>
    </div>
  );
}

const slideCount = 4;

export function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [birthDate, setBirthDate] = useState("");
  const isLast = index === slideCount - 1;

  function finish() {
    progressActions.setBirthDate(birthDate || null);
    router.push(routes.typeTest);
  }

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

      {index === 0 && <SlideSystem />}
      {index === 1 && <SlideElements />}
      {index === 2 && <SlideProgram />}
      {index === 3 && <SlideBirth value={birthDate} onChange={setBirthDate} />}

      <div className="mt-auto space-y-5">
        <div className="flex justify-center gap-2" aria-label={`Экран ${index + 1} из ${slideCount}`}>
          {Array.from({ length: slideCount }, (_, i) => (
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
          <Button size="lg" className="h-12 w-full text-base" onClick={finish}>
            Перейти к тесту
          </Button>
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
