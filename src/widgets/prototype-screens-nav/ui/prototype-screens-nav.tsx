"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";

import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";

/** Для разработки прототипа: быстрый переход между экранами. */
const prototypeScreens: { href: string; label: string; note?: string }[] = [
  { href: routes.auth, label: "Регистрация и вход" },
  { href: routes.onboarding, label: "Онбординг" },
  { href: routes.typeTest, label: "Тест на тип", note: "по шагам" },
  { href: `${routes.typeTest}?variant=page`, label: "Тест на тип", note: "одной страницей" },
  { href: routes.typeResult, label: "Результат теста" },
  { href: routes.program, label: "Программа" },
  { href: routes.together, label: "Вместе" },
  { href: routes.library, label: "Библиотека" },
  { href: routes.profile, label: "Профиль" },
  { href: `${routes.person}/pavel`, label: "Профиль Павла", note: "запрос в друзья" },
  { href: routes.birth, label: "Дата рождения", note: "только практики" },
  { href: `${routes.birth}?view=square`, label: "Дата рождения", note: "квадрат" },
  { href: `${routes.elementResult}?badge=1`, label: "Итог стихии", note: "бейдж" },
  { href: `${routes.elementResult}?badge=0`, label: "Итог стихии", note: "без бейджа" },
  { href: routes.admin, label: "Админка", note: "веб-версия" },
  { href: routes.adminSupport, label: "Админка", note: "доп. практики" },
];

function isActive(pathname: string, href: string): boolean {
  const path = href.split("?")[0];
  return pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));
}

export function PrototypeScreensNav() {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
          />
        }
      >
        <LayoutGrid className="size-4" />
        Экраны
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(100%,390px)] sm:max-w-[390px]">
        <SheetHeader>
          <SheetTitle>Все экраны</SheetTitle>
          <SheetDescription>
            Быстрый переход по прототипу. На продакшене этого меню не будет.
          </SheetDescription>
        </SheetHeader>
        <nav aria-label="Экраны прототипа">
          <ul className="flex flex-col gap-1 px-4 pb-6">
            {prototypeScreens.map((screen) => {
              const active = isActive(pathname, screen.href);
              return (
                <li key={screen.href}>
                  <Link
                    href={screen.href}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-primary/10 font-medium text-primary"
                        : "hover:bg-muted",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <span>{screen.label}</span>
                    {screen.note && (
                      <span className="text-xs text-muted-foreground">{screen.note}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
