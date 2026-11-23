"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ComponentType, type MouseEvent, type ReactNode, type TouchEvent } from "react";
import { ExternalLink, HandHeart, Infinity as InfinityIcon, Share, SquarePlus, UserPlus } from "lucide-react";

import { ElementBadge, getElements } from "@/entities/element";
import { progressActions } from "@/entities/progress";
import {
  detectDevice,
  InstallSheet,
  markShown,
  openedFromHomeScreen,
  openInBrowserUrl,
  readReminderState,
  saveReminderState,
  useInstallPrompt,
} from "@/features/install-app";
import { APP_NAME } from "@/shared/config/brand";
import { isStaticPrototype } from "@/shared/config/env";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { typograph } from "@/shared/lib/typograph";
import { Button, buttonVariants } from "@/shared/ui/button";
import { GlassCard } from "@/shared/ui/glass-card";
import { backgroundSrc, ScreenLayout, type ScreenBackground } from "@/widgets/screen-layout";

type Slide = {
  /** page – заголовок сверху, картинка видна целиком под карточками (как в макете 02_3). */
  variant?: "hero" | "page";
  background: ScreenBackground;
  /** Текст узкой колонкой по центру, вписан в картинку. */
  centered?: boolean;
  title: ReactNode;
  subtitle?: ReactNode;
  body?: ReactNode;
  /** Светлое пятно под текстом: картинка за ним пёстрая (шары стихий). */
  textGlow?: boolean;
  /** Полоски после текста: вне пятна, у них своя подложка. */
  after?: ReactNode;
};

function ElementsList() {
  return (
    // Тонкие полоски: показать все пять стихий и не закрыть шары на картинке.
    <ul className="space-y-1">
      {getElements().map((element) => (
        <li
          key={element.id}
          className="flex h-8 items-center justify-between rounded-xl border border-white/60 bg-background/68 px-3 backdrop-blur-[6px]"
        >
          <ElementBadge element={element} />
          <span className="type-caption text-muted-foreground">{element.season}</span>
        </li>
      ))}
    </ul>
  );
}

const togetherParts = [
  { icon: UserPlus, title: "Друзья", text: "Добавляйте людей, которые тоже проходят программу." },
  { icon: InfinityIcon, title: "Совместная практика", text: "Одна практика на двоих. Каждый проходит её в своё время." },
  { icon: HandHeart, title: "Поддержка", text: "В ленте видны важные шаги друзей: их можно поддержать." },
];

/** Значки экрана программы – как на макете `design/screens/02_3_program`, не из общего набора. */
function ProgramIcon({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

function PracticeIcon({ className }: { className?: string }) {
  return (
    <ProgramIcon className={className}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
      <path d="M8 3.2v3.4M16 3.2v3.4M3.5 9.4h17" />
      <path d="M8.2 14.4c1.1 1.4 2.3 2.1 3.8 2.1s2.7-.7 3.8-2.1" />
    </ProgramIcon>
  );
}

function RitualsIcon({ className }: { className?: string }) {
  return (
    <ProgramIcon className={className}>
      <path d="M3 9c1.4-1.6 2.8-1.6 4.2 0S10 10.6 11.4 9" />
      <path d="M3 15c1.4-1.6 2.8-1.6 4.2 0s3 1.6 4.2 0" />
      <path d="m14.2 8.2 1.5 1.5 3-3" />
      <path d="m14.2 14.2 1.5 1.5 3-3" />
    </ProgramIcon>
  );
}

function LibraryIcon({ className }: { className?: string }) {
  return (
    <ProgramIcon className={className}>
      <path d="M4 7.4c2.4-.9 4.6-.5 6 .8 1.4-1.3 3.6-1.7 6-.8 1 .3 1.8.5 2.5.5v10.4c-.8-.2-1.6-.4-2.6-.7-2.4-.6-4.4-.2-5.9.9-1.5-1.1-3.5-1.5-5.9-.9-1 .3-1.8.5-2.6.7V7.9c.7 0 1.5-.2 2.5-.5Z" />
      <path d="M12 8.2v10.2" />
      <path d="M10 10.1v4.8l5-2.4-5-2.4Z" fill="currentColor" stroke="none" strokeWidth="0" />
    </ProgramIcon>
  );
}

const programParts = [
  { icon: PracticeIcon, title: "Практика на сегодня", text: "Набор коротких практик и медитаций на каждый день." },
  {
    icon: RitualsIcon,
    title: "Ритуалы недели",
    text: "Зарядка, медитации, которые можно выполнять в удобное время среди недели.",
  },
  { icon: LibraryIcon, title: "Библиотека", text: "Видео, книги и фильмы в библиотеке." },
];

function IconCard({
  icon: Icon,
  title,
  text,
  compact = false,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
  /** Плотнее: внизу картинки должно остаться место для графики. */
  compact?: boolean;
}) {
  return (
    <GlassCard className={cn("flex", compact ? "gap-3 p-4" : "gap-4")}>
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-full bg-primary/8 text-primary",
          compact ? "size-10" : "size-12",
        )}
      >
        <Icon className="size-6" />
      </span>
      <div className="space-y-1">
        <p className="type-block">{title}</p>
        <p className="type-secondary text-muted-foreground">{typograph(text)}</p>
      </div>
    </GlassCard>
  );
}

const slides: Slide[] = [
  {
    background: "02_0_intro_underlay",
    centered: true,
    title: "Дорогой Матэтис",
    body: (
      <div className="type-secondary space-y-3 text-foreground">
        <p>
          {typograph(
            "Только это слово может наиболее чётко описать весь смысл не просто ученика или последователя. Оно несёт смысл мыслителя, постигающего идеал точного знания.",
          )}
        </p>
        <p>
          {typograph(
            "Матэтис – тот, кто обладает таким способом мышления, который может делить всё сложное на простые элементы, классифицировать их, выстраивая в чёткую схему, а затем синтезировать.",
          )}
        </p>
      </div>
    ),
  },
  {
    background: "02_1_onboard",
    textGlow: true,
    title: `Ваш путь развития в ${APP_NAME}`,
    subtitle: "Короткий тест определит ваш психотип и поможет составить программу развития.",
  },
  {
    background: "02_2_onboard",
    title: "5 стихий – 5 сезонов",
    textGlow: true,
    subtitle: "Стихии сменяются вместе со временем года, а с ними обновляется и ваша программа.",
    after: <ElementsList />,
  },
  {
    variant: "page",
    background: "02_3_onboard",
    title: "Как устроена программа",
    body: (
      <div className="space-y-2">
        {programParts.map((part) => (
          <IconCard key={part.title} compact {...part} />
        ))}
      </div>
    ),
  },
  {
    variant: "page",
    background: "02_4_together",
    title: "Путь можно пройти вместе",
    body: (
      <div className="space-y-2">
        {togetherParts.map((part) => (
          <IconCard key={part.title} compact {...part} />
        ))}
      </div>
    ),
  },
];

const installCards = {
  iphone: {
    icon: Share,
    title: "iPhone",
    text: "В Safari нажмите «Поделиться», затем «На экран „Домой“» и «Добавить».",
  },
  android: {
    icon: SquarePlus,
    title: "Android",
    text: "Меню браузера → «Установить приложение» или «Добавить на главный экран».",
  },
  inApp: {
    icon: ExternalLink,
    title: "Откройте в браузере",
    text: "Из Telegram или Instagram приложение не установить. Нажмите меню ⋯ → «Открыть в браузере», а там установите приложение.",
  },
};

function InstallScreen() {
  const router = useRouter();
  const install = useInstallPrompt();
  const [help, setHelp] = useState(false);
  const device = detectDevice(navigator.userAgent, navigator.maxTouchPoints);

  // Экран установки считается показом напоминания: следующее – не раньше чем через 3 дня.
  useEffect(() => saveReminderState(markShown("onboarding", readReminderState(), Date.now())), []);
  const cards =
    device === "iphone"
      ? [installCards.iphone]
      : device === "android"
        ? [installCards.android]
        : device === "inApp"
          ? [installCards.inApp]
          : [installCards.iphone, installCards.android];

  async function onInstall() {
    if (!(await install.prompt())) setHelp(true);
  }

  // Встроенный браузер: на iPhone пробуем открыть Safari, на Android – Chrome.
  const inAppPhone = /Android/.test(navigator.userAgent) ? "android" : "iphone";
  const mainAction =
    device === "inApp" ? (
      <a
        href={openInBrowserUrl(inAppPhone, new URL(window.location.href))}
        className={buttonVariants({ size: "cta" })}
      >
        Открыть в браузере
      </a>
    ) : (
      !install.installed && (
        <Button size="cta" onClick={() => void onInstall()}>
          Установить приложение
        </Button>
      )
    );

  return (
    <ScreenLayout
      variant="hero"
      background="02_5_onboard"
      narrow
      title="Установите приложение"
      subtitle={
        install.installed
          ? `Готово! Откройте ${APP_NAME} с иконки и войдите.`
          : (
              <>
                Сайт откроется как приложение.
                <br />
                {typograph("Тест удобно пройти уже с иконки.")}
              </>
            )
      }
      actions={
        <div className="flex w-full flex-col gap-2">
          {mainAction}
          <Button variant="ghost" size="cta" className="text-muted-foreground" onClick={() => continueToTest(router)}>
            {device === "inApp" ? "Продолжить здесь" : "Продолжить в браузере"}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {cards.map((card) => (
          <IconCard key={card.title} {...card} />
        ))}
        <InstallSheet device={device} open={help} onOpenChange={setHelp} />
      </div>
    </ScreenLayout>
  );
}

/**
 * Листание касанием, как в сторис: правая половина экрана – вперёд, левая – назад.
 * Свайп влево и вправо тоже листает. Кнопки и ссылки работают как обычно.
 */
function TapNavigation({ onNext, onBack, children }: { onNext?: () => void; onBack?: () => void; children: ReactNode }) {
  // Где начался свайп. В ref, а не в состоянии: касание не должно перерисовывать экран.
  const touchX = useRef<number | null>(null);

  function onClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    // Нажатия в подсказке поверх экрана (она в портале) и по кнопкам не листают.
    if (!event.currentTarget.contains(target) || target.closest("a, button, input")) return;
    const { left, width } = event.currentTarget.getBoundingClientRect();
    if (event.clientX - left > width / 2) onNext?.();
    else onBack?.();
  }

  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchX.current === null) return;
    const dx = event.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) onNext?.();
    else onBack?.();
  }

  return (
    <div
      // Safari на iPhone подсвечивает нажатый блок серым – здесь блок на весь экран, подсветка не нужна.
      className="flex flex-1 flex-col [-webkit-tap-highlight-color:transparent]"
      onClick={onClick}
      onTouchStart={(event) => {
        touchX.current = event.touches[0].clientX;
      }}
      onTouchEnd={onTouchEnd}
    >
      {children}
    </div>
  );
}

/**
 * Онбординг: показывается один раз, сразу после регистрации.
 * Последний экран – установка на «Домой», без точек шагов.
 * После входа (в том числе в установленном приложении) человек попадает в тест или программу, а не сюда.
 * На сайте-прототипе каждый проход заканчивается вопросами теста, даже если его уже проходили в этом браузере.
 */

/** После онбординга – тест. На сайте-прототипе прошлый результат в браузере проход не сокращает. */
function continueToTest(router: { push: (href: string) => void }) {
  if (isStaticPrototype) progressActions.forgetTest();
  router.push(routes.typeTest);
}

export function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [installStep, setInstallStep] = useState(false);

  // Картинки следующих экранов грузим заранее, пока человек читает первый.
  useEffect(() => {
    for (const background of [...slides.map((slide) => slide.background), "02_5_onboard" as const]) {
      new Image().src = backgroundSrc(background);
    }
  }, []);

  // Из установленного приложения шаг установки не нужен.
  function finish() {
    if (openedFromHomeScreen()) continueToTest(router);
    else setInstallStep(true);
  }

  if (installStep) {
    return (
      <TapNavigation onBack={() => setInstallStep(false)}>
        <InstallScreen />
      </TapNavigation>
    );
  }

  const slide = slides[index];
  const isLast = index === slides.length - 1;
  const next = () => (isLast ? finish() : setIndex(index + 1));

  return (
    <TapNavigation onNext={next} onBack={index > 0 ? () => setIndex(index - 1) : undefined}>
      <ScreenLayout
        key={index}
        variant={slide.variant ?? "hero"}
        background={slide.background}
        centered={slide.centered}
        textGlow={slide.textGlow}
        afterHaze={slide.after}
        // Кроме первого экрана: там текст и так узкой колонкой во вратах.
        narrow={!slide.centered}
        headerAction={
          <button type="button" onClick={finish} className="type-secondary -mr-2 min-h-11 px-2 text-muted-foreground">
            Пропустить
          </button>
        }
        title={slide.title}
        subtitle={slide.subtitle}
        // Последняя точка – экран установки: на нём самом точек нет.
        steps={{ count: slides.length + 1, current: index }}
        actions={
          <Button size="cta" onClick={next}>
            Дальше
          </Button>
        }
      >
        {slide.body}
      </ScreenLayout>
    </TapNavigation>
  );
}
