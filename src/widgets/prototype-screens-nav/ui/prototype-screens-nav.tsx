"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentProps } from "react";
import { LayoutGrid } from "lucide-react";

import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";

/** Для разработки прототипа: быстрый переход между экранами. */
// ?demo=expired показывает «Срок подписки истёк» без входа — см. entities/access/api/use-my-access.ts.
const prototypeScreens: { href: string; label: string; note?: string }[] = [
  { href: routes.auth, label: "Регистрация и вход" },
  { href: routes.onboarding, label: "Онбординг" },
  { href: routes.typeTest, label: "Тест на тип" },
  { href: routes.typeResult, label: "Результат теста" },
  { href: routes.program, label: "Программа" },
  { href: `${routes.program}?demo=expired`, label: "Срок подписки истёк" },
  { href: routes.together, label: "Вместе" },
  { href: routes.library, label: "Библиотека" },
  { href: routes.profile, label: "Профиль" },
  { href: routes.admin, label: "Админка", note: "веб-версия" },
];

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** reload — обычная ссылка: страница загрузится заново. Иначе — быстрый переход Next.js. */
function ScreenLink({ href, reload, ...props }: ComponentProps<"a"> & { href: string; reload: boolean }) {
  if (reload) return <a href={`${basePath}${href}`} {...props} />;
  return <Link href={href} {...props} />;
}

function isActive(pathname: string, search: string, href: string): boolean {
  const [path, query = ""] = href.split("?");
  // Экран «без доступа» и обычный — на одном адресе, различаются только ?demo=…
  if (search.includes("demo=") !== query.includes("demo=")) return false;
  return pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));
}

export function PrototypeScreensNav() {
  const pathname = usePathname();
  // Список рисуется только в открытом меню, то есть в браузере: адрес уже известен.
  // useSearchParams не берём — на сайте-прототипе он требует отдельной обёртки для сборки.
  const search = typeof window === "undefined" ? "" : window.location.search;
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Экраны (для разработки)"
            title="Экраны (для разработки)"
            className="pointer-events-auto rounded-full text-muted-foreground opacity-35 hover:bg-background/70 hover:opacity-100"
          />
        }
      >
        <LayoutGrid className="size-5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(100%,390px)] sm:max-w-[390px]">
        <SheetHeader>
          <SheetTitle>Все экраны</SheetTitle>
        </SheetHeader>
        <nav aria-label="Экраны прототипа">
          <ul className="flex flex-col gap-1 px-4 pb-6">
            {prototypeScreens.map((screen) => {
              const active = isActive(pathname, search, screen.href);
              return (
                <li key={screen.href}>
                  {/* Вход в демо ?demo=… и выход из него — с загрузкой страницы заново:
                      иначе приложение не перечитает демо-данные доступа. */}
                  <ScreenLink
                    href={screen.href}
                    reload={screen.href.includes("demo=") || search.includes("demo=")}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-primary/10 font-medium text-primary"
                        : "hover:bg-muted",
                    )}
                    aria-current={active ? "page" : undefined}
                    // Выбрал экран — меню закрывается, экран сразу виден.
                    onClick={() => setOpen(false)}
                  >
                    <span>{screen.label}</span>
                    {screen.note && (
                      <span className="text-xs text-muted-foreground">{screen.note}</span>
                    )}
                  </ScreenLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
