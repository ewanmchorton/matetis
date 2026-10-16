import type { ReactNode } from "react";

import { PrototypeScreensNav } from "@/widgets/prototype-screens-nav";

/** Мобильная рамка: на широком экране показываем «телефон» шириной 390 px по центру. */
export function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-background shadow-xl shadow-black/5 min-[391px]:border-x">
      {/* Кнопка «Экраны» — только на время разработки. Висит поверх экрана и не сдвигает его. */}
      <div className="pointer-events-none fixed top-[calc(var(--safe-top)+4px)] left-1/2 z-50 flex w-full max-w-[390px] -translate-x-1/2 justify-end px-1">
        <PrototypeScreensNav />
      </div>
      {children}
    </div>
  );
}
