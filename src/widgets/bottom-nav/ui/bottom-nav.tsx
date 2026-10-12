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

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Главное меню"
      className="sticky bottom-0 z-10 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="grid grid-cols-4">
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
                  "flex flex-col items-center gap-1 py-2.5 text-xs font-medium text-muted-foreground transition-colors",
                  active && "text-primary",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-12 place-items-center rounded-full transition-colors",
                    active && "bg-primary/10",
                  )}
                >
                  <tab.icon className="size-5" />
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
