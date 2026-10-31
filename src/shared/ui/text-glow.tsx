import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

const ivory = (alpha: number) => `rgb(250 247 242 / ${alpha})`;

/** title — заголовок блока: дымка меньше и слабее. text — подпись: дымка ниже по высоте. Обе заканчиваются чуть за краями текста. */
const glows = {
  title: {
    className: "-inset-x-4 -inset-y-3",
    background: `radial-gradient(farthest-side, ${ivory(0.65)} 45%, ${ivory(0.35)} 75%, ${ivory(0)} 100%)`,
  },
  text: {
    className: "-inset-x-4 -inset-y-[9px]",
    background: `radial-gradient(farthest-side, ${ivory(0.8)} 65%, ${ivory(0.48)} 85%, ${ivory(0)} 100%)`,
  },
};

/**
 * Текст прямо на картинке, без карточки: под ним мягкий светлый овал чуть шире текста,
 * края плавно растворяются (docs/design-guide.md, «Графика и фоны»).
 * Только градиент: размытие и маски в Safari рисуются с резкими краями.
 */
export function TextGlow({ children, kind }: { children: ReactNode; kind: keyof typeof glows }) {
  const glow = glows[kind];
  return (
    <div className="relative isolate w-fit">
      <span
        aria-hidden
        className={cn("pointer-events-none absolute -z-10", glow.className)}
        style={{ background: glow.background }}
      />
      {children}
    </div>
  );
}
