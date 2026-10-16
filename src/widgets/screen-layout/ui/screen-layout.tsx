import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { Logo } from "@/shared/ui/logo";
import { StepDots } from "@/shared/ui/step-dots";

/** Фоны из design/backgrounds, уменьшенные до 780 px в ширину (2× от 390). Лежат в public/backgrounds. */
export type ScreenBackground = "01_reg" | "06_profile";

type ScreenLayoutProps = {
  /**
   * hero — картинка сверху, текст и кнопка прижаты к низу экрана (вход, онбординг).
   * page — заголовок сразу под логотипом, длинная прокрутка (вкладки приложения).
   */
  variant: "hero" | "page";
  background?: ScreenBackground;
  /** Правая часть строки с логотипом: например, «Пропустить». */
  headerAction?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  /** Кнопки внизу экрана (только для hero). */
  actions?: ReactNode;
  /** Индикатор шагов над кнопками (только для hero). */
  steps?: { count: number; current: number };
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const ivory = (alpha: number) => `rgb(250 247 242 / ${alpha})`;

// Верх экрана плавно переходит в сплошной Ivory — того же цвета полоса под часами.
// Низ тоже уходит в Ivory: если картинка короче экрана, обрыва не видно.
const fades = {
  hero: [
    `linear-gradient(to bottom, ${ivory(1)} 0, ${ivory(0)} 110px)`,
    `linear-gradient(to bottom, ${ivory(0)} 18%, ${ivory(0.78)} 34%, ${ivory(0.85)} 85%, ${ivory(1)} 100%)`,
  ],
  page: [
    `linear-gradient(to bottom, ${ivory(1)} 0, ${ivory(0.65)} 140px, ${ivory(0)} 280px)`,
    `linear-gradient(to bottom, ${ivory(0)} 80%, ${ivory(0.9)} 100%)`,
  ],
};

/**
 * Общий каркас экрана. Положение логотипа, заголовка, индикатора шагов и кнопок
 * задаётся только здесь — цифры в docs/design-guide.md, раздел «Расположение».
 */
export function ScreenLayout({
  variant,
  background,
  headerAction,
  title,
  subtitle,
  children,
  actions,
  steps,
}: ScreenLayoutProps) {
  return (
    <div className="relative isolate flex min-h-dvh flex-1 flex-col">
      {background && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-y-0 left-1/2 -z-10 w-full max-w-[390px] -translate-x-1/2 bg-background bg-cover bg-top"
          style={{
            backgroundImage: [...fades[variant], `url(${basePath}/backgrounds/${background}.jpg)`].join(", "),
          }}
        />
      )}

      <header className="px-(--screen-gutter) pt-[calc(var(--safe-top)+var(--header-top))]">
        <div className="flex h-(--header-height) items-center justify-between gap-4">
          <Logo />
          {headerAction}
        </div>
      </header>

      <main
        className={cn(
          "flex flex-1 flex-col px-(--screen-gutter)",
          // Отступ под нижним меню добавляет раскладка вкладок, здесь — только 24 px.
          variant === "hero" ? "pb-[calc(var(--safe-bottom)+var(--action-bottom))]" : "pb-6",
        )}
      >
        {variant === "hero" && (
          // Растягивается и опускает текст к низу экрана, но не даёт заголовку подняться выше 160 px.
          <div
            aria-hidden
            className="min-h-[calc(var(--hero-min-title-top)-var(--header-top)-var(--header-height))] flex-1"
          />
        )}

        <div className={cn("space-y-2", variant === "page" && "mt-(--page-title-gap)")}>
          <h1 className="type-title text-foreground">{title}</h1>
          {subtitle && <p className="type-body text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="mt-6 flex flex-col gap-6">{children}</div>

        {variant === "hero" && (actions || steps) && (
          <div className="flex flex-col gap-6 pt-6">
            {steps && <StepDots count={steps.count} current={steps.current} />}
            {actions && <div className="flex gap-3">{actions}</div>}
          </div>
        )}
      </main>
    </div>
  );
}
