import type { ReactNode } from "react";

import { PrototypeScreensNav } from "@/widgets/prototype-screens-nav";

/** Мобильный прототип: на широком экране показываем «телефон» по центру. */
export function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-background shadow-xl shadow-black/5 min-[391px]:border-x">
      <div className="sticky top-0 z-30 flex justify-end bg-background/90 px-5 py-2 backdrop-blur-sm">
        <PrototypeScreensNav />
      </div>
      {children}
    </div>
  );
}
