"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Sparkles, UserRound, Users } from "lucide-react";

import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";

const tabs = [
  { href: routes.program, label: "Программа", icon: Sparkles },
  { href: routes.together, label: "Вместе", icon: Users },
  { href: routes.library, label: "Библиотека", icon: BookOpen },
  { href: routes.profile, label: "Профиль", icon: UserRound },
];

/** Нижнее меню: плавающая панель, положение — docs/design-guide.md, раздел «Расположение». */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Главное меню"
      className="fixed bottom-[max(var(--nav-bottom),calc(var(--safe-bottom)-12px))] left-1/2 z-40 h-(--nav-height) w-[calc(min(100vw,440px)-2*var(--nav-side))] -translate-x-1/2 rounded-3xl border border-white/60 bg-background/72 shadow-[0_4px_20px_rgb(41_44_40/0.08)] backdrop-blur-[6px]"
    >
      <ul className="grid h-full grid-cols-4">
        {tabs.map((tab) => {
          const active =
            tab.href === routes.profile
              ? pathname === routes.profile || pathname.startsWith(`${routes.person}/`)
              : pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 type-caption text-muted-foreground transition-colors",
                  active && "text-primary",
                )}
              >
                <tab.icon className="size-6" strokeWidth={1.5} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
