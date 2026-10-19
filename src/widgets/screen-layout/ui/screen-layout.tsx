import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { Logo } from "@/shared/ui/logo";
import { StepDots } from "@/shared/ui/step-dots";

/** Фоны из design/backgrounds, уменьшенные до 780 px в ширину (2× от 390). Лежат в public/backgrounds. */
export type ScreenBackground = "01_reg" | "03_1_test" | "03_4_test" | "03_result" | "06_profile";

/**
 * Для экранов с картинкой: на какой высоте картинки (в ширинах экрана) должен оказаться
 * верх заголовка. Выше этой точки — пейзаж, ниже — светлая часть, на которой лежит текст.
 */
const heroTextLine: Partial<Record<ScreenBackground, number>> = {
  "01_reg": 0.9,
  "03_4_test": 1.2,
};

/** Высота фоновых картинок в ширинах экрана: 1690 / 780. */
const BACKGROUND_RATIO = 1690 / 780;

type ScreenLayoutProps = {
  /**
   * hero — картинка сверху, текст и кнопка прижаты к низу экрана (вход, онбординг).
   * page — заголовок сразу под логотипом, длинная прокрутка (вкладки приложения, шаги теста).
   */
  variant: "hero" | "page";
  background?: ScreenBackground;
  /** Плотнее: подзаголовок 15 px и меньше промежутки. Для экранов с длинной формой. */
  compact?: boolean;
  /** Правая часть строки с логотипом: например, «Пропустить». */
  headerAction?: ReactNode;
  /**
   * Текст лежит прямо на картинке, без карточек (page): под заголовком и содержимым
   * светлая дымка, картинка за текстом приглушается.
   */
  haze?: boolean;
  /** Блок после содержимого, уже без дымки: например, карточка, у которой своя подложка. */
  afterHaze?: ReactNode;
  /** Над заголовком: например, «Шаг 2 из 4» с полосой прогресса. */
  beforeTitle?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  /** Кнопки внизу экрана. В page — после содержимого, прижаты к низу экрана. */
  actions?: ReactNode;
  /** Индикатор шагов над кнопками (только для hero). */
  steps?: { count: number; current: number };
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const screenWidth = "min(100vw, 440px)";
const ivory = (alpha: number) => `rgb(250 247 242 / ${alpha})`;

/**
 * Плавный переход из сплошного Ivory (как полоса под часами) в картинку за height пикселей.
 * Прозрачность убывает по плавной кривой, поэтому границы перехода не видно.
 */
function topFade(height: number, from = 1) {
  const stops = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1].map((t) => {
    const alpha = from * (1 - t) * (1 - t) * (1 + 2 * t); // плавное затухание без излома
    return `${ivory(Number(alpha.toFixed(3)))} ${Math.round(t * height)}px`;
  });
  return `linear-gradient(to bottom, ${stops.join(", ")})`;
}
const imageUrl = (background: ScreenBackground) => `url(${basePath}/backgrounds/${background}.jpg)`;

/**
 * Общий каркас экрана. Положение логотипа, заголовка, индикатора шагов и кнопок
 * задаётся только здесь — цифры в docs/design-guide.md, раздел «Расположение».
 */
export function ScreenLayout({
  variant,
  background,
  compact = false,
  headerAction,
  haze = false,
  afterHaze,
  beforeTitle,
  title,
  subtitle,
  children,
  actions,
  steps,
}: ScreenLayoutProps) {
  const header = (
    <header className="px-(--screen-gutter) pt-[calc(var(--safe-top)+var(--header-top))]">
      <div className="flex h-(--header-height) items-center justify-between gap-4">
        <Logo />
        {headerAction}
      </div>
    </header>
  );

  const textLine = background ? (heroTextLine[background] ?? 0.9) : 0.9;
  // Сколько картинки остаётся ниже верха заголовка.
  const belowTitle = `calc(${screenWidth} * ${BACKGROUND_RATIO - textLine})`;

  return (
    <div className="relative isolate flex min-h-dvh flex-1 flex-col overflow-clip">
      {background && variant === "page" && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-y-0 left-1/2 -z-10 w-full max-w-[440px] -translate-x-1/2 bg-background bg-cover bg-top"
          style={{
            backgroundImage: [
              // Мягкий переход из полосы под часами (Ivory) в картинку.
              topFade(110),
              `linear-gradient(to bottom, ${ivory(0)} 80%, ${ivory(0.9)} 100%)`,
              imageUrl(background),
            ].join(", "),
          }}
        />
      )}

      {background && variant === "page" && (
        // Светлое пятно под заголовком экрана, как в макетах: заголовок читается, картинка вокруг — нет.
        <div
          aria-hidden
          className="pointer-events-none absolute top-[calc(var(--safe-top)+var(--header-top)+var(--header-height)+var(--page-title-gap)-30px)] left-0 -z-10 h-[100px] w-[260px] blur-xl"
          style={{
            background: `radial-gradient(ellipse 60% 50% at 38% 50%, ${ivory(0.92)} 0%, ${ivory(0.7)} 45%, ${ivory(0)} 100%)`,
          }}
        />
      )}

      {variant === "hero" ? (
        // Верхняя часть растягивается и опускает текст к низу экрана.
        // Картинка привязана к заголовку: над ним — пейзаж, под ним — светлая часть.
        <div className="relative flex flex-1 flex-col">
          {background && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 -z-10 bg-background bg-bottom bg-no-repeat"
              style={{
                bottom: `calc(-1 * ${belowTitle})`,
                // Если картинка ниже экрана, над ней остаётся Ivory: второй переход
                // привязан к верхнему краю картинки и прячет его.
                backgroundSize: `100% 100%, 100% calc(${screenWidth} * ${BACKGROUND_RATIO}), 100% 100%, 100% auto`,
                backgroundImage: [
                  topFade(110),
                  topFade(110),
                  `linear-gradient(to bottom, ${ivory(0)} calc(100% - ${belowTitle} - 40px), ${ivory(0.45)} calc(100% - ${belowTitle} + 40px), ${ivory(0.6)} 80%, ${ivory(1)} 100%)`,
                  imageUrl(background),
                ].join(", "),
              }}
            />
          )}
          {header}
          <div
            aria-hidden
            className="min-h-[calc(var(--hero-min-title-top)-var(--header-top)-var(--header-height))] flex-1"
          />
        </div>
      ) : (
        header
      )}

      <main
        className={cn(
          "flex flex-col px-(--screen-gutter)",
          // Отступ под нижним меню добавляет раскладка вкладок, здесь — только 24 px.
          variant === "hero" || actions ? "pb-[calc(var(--safe-bottom)+var(--action-bottom))]" : "pb-6",
          variant === "page" && "flex-1",
        )}
      >
        <div className="relative">
          {haze && (
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-(--screen-gutter) -top-10 -bottom-6 -z-10 bg-background/60 backdrop-blur-[6px]"
              style={{
                // Края дымки растворяются: сверху за 40 px, снизу — в промежутке до следующего блока.
                maskImage: "linear-gradient(to bottom, transparent 0, black 40px, black calc(100% - 48px), transparent 100%)",
              }}
            />
          )}
          {beforeTitle && (
            <div className={cn("mb-4", variant === "page" && "mt-(--page-title-gap)")}>{beforeTitle}</div>
          )}
          <div
            className={cn(
              compact ? "space-y-1.5" : "space-y-2",
              variant === "page" && !beforeTitle && "mt-(--page-title-gap)",
            )}
          >
            <h1 className="type-title text-foreground">{title}</h1>
            {subtitle && (
              <p className={cn(compact ? "type-secondary" : "type-body", "text-muted-foreground")}>{subtitle}</p>
            )}
          </div>

          <div className={cn("flex flex-col", compact ? "mt-4 gap-4" : "mt-6 gap-6")}>{children}</div>
        </div>
        {afterHaze && <div className={cn("flex flex-col", compact ? "mt-4 gap-4" : "mt-6 gap-6")}>{afterHaze}</div>}

        {(actions || (variant === "hero" && steps)) && (
          <div className={cn("flex flex-col gap-6", compact ? "pt-4" : "pt-6", variant === "page" && "mt-auto")}>
            {variant === "hero" && steps && <StepDots count={steps.count} current={steps.current} />}
            {actions && <div className="flex gap-3">{actions}</div>}
          </div>
        )}
      </main>
    </div>
  );
}
