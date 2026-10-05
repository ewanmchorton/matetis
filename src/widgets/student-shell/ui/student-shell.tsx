"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { findSection, studentNav } from "@/shared/config/navigation";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Logo } from "@/shared/ui/logo";

function activeSection(pathname: string) {
  if (pathname.startsWith("/practice")) return studentNav[0];
  return findSection(studentNav, pathname);
}

export function StudentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const section = activeSection(pathname);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Logo href={routes.program.home} />
          <nav className="hidden items-center gap-1 md:flex">
            {studentNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  section === item && "bg-muted font-medium text-foreground",
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
        {section?.children && (
          <nav
            aria-label={`Разделы: ${section.title}`}
            className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none]"
          >
            {section.children.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                  pathname === c.href && "bg-primary text-primary-foreground hover:text-primary-foreground",
                )}
              >
                {c.title}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 md:pb-12">
        {children}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Основное меню"
      >
        <div className="grid grid-cols-3">
          {studentNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-xs text-muted-foreground",
                section === item && "font-medium text-primary",
              )}
            >
              <item.icon className="size-5" />
              {item.title}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
