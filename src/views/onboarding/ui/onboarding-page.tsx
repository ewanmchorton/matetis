"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarCheck, Repeat, Share, Smartphone, Sparkles } from "lucide-react";

import { ElementBadge, getCurrentElement, getElements } from "@/entities/element";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Button, buttonVariants } from "@/shared/ui/button";
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

const slides = [SlideSystem, SlideElements, SlideProgram];

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function InstallSlide({
  canInstall,
  onInstall,
}: {
  canInstall: boolean;
  onInstall: () => void;
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold leading-tight">Поставьте МАТЭТИС на экран «Домой»</h1>
      <p className="leading-relaxed text-muted-foreground">
        Сайт откроется как приложение. Тест удобно пройти уже с иконки.
      </p>
      {canInstall && (
        <Button size="lg" className="h-12 w-full text-base" onClick={onInstall}>
          <Smartphone />
          Добавить на экран «Домой»
        </Button>
      )}
      <ol className="space-y-3 pt-1">
        <li className="rounded-xl border bg-card p-4">
          <p className="font-medium">iPhone</p>
          <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
            <Share className="mt-0.5 size-4 shrink-0" />
            В Safari нажмите «Поделиться», затем «На экран Домой» и «Добавить».
          </p>
        </li>
        <li className="rounded-xl border bg-card p-4">
          <p className="font-medium">Android</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Меню браузера → «Установить приложение» или «Добавить на главный экран».
          </p>
        </li>
      </ol>
    </div>
  );
}

function openedFromHomeScreen(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

export function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [askInstall, setAskInstall] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const Slide = slides[index];
  const isLast = index === slides.length - 1;

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    setInstallEvent(null);
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

      {askInstall ? (
        <InstallSlide canInstall={installEvent !== null} onInstall={() => void install()} />
      ) : (
        Slide && <Slide />
      )}

      <div className="mt-auto space-y-5">
        {!askInstall && (
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
        )}
        {askInstall ? (
          <Link href={routes.typeTest} className={buttonVariants({ size: "lg", className: "h-12 w-full text-base" })}>
            Пройти тест
          </Link>
        ) : isLast ? (
          <Button
            size="lg"
            className="h-12 w-full text-base"
            onClick={() => {
              if (openedFromHomeScreen()) router.push(routes.typeTest);
              else setAskInstall(true);
            }}
          >
            Дальше
            <ArrowRight />
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
