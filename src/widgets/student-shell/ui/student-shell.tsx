"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { studentNav } from "@/shared/config/navigation";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Logo } from "@/shared/ui/logo";

const isActive = (pathname: string, href: string) =>
  pathname === href ||
  pathname.startsWith(`${href}/`) ||
  (href === routes.program && pathname.startsWith("/practice"));

export function StudentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Logo href={routes.program} />
          <nav className="hidden items-center gap-1 md:flex">
            {studentNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive(pathname, item.href) && "bg-muted font-medium text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.title}
              </Link>
            ))}
          </nav>
          <Link href={routes.map} className="text-xs text-muted-foreground hover:text-foreground">
            Карта экранов
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 md:pb-12">
        {children}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Основное меню"
      >
        <div className="grid grid-cols-3">
          {studentNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-xs text-muted-foreground",
                  active && "font-medium text-primary",
                )}
              >
                <item.icon className="size-5" />
                {item.title}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
