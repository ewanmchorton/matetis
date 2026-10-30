"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, ExternalLink, LayoutDashboard, Library, ListChecks, LockKeyhole, Users } from "lucide-react";

import type { PersonRole } from "@/shared/auth/roles";
import { APP_NAME } from "@/shared/config/brand";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";

// adminOnly — раздел не виден контент-менеджеру.
const allNav = [
  { href: routes.admin, label: "Обзор", icon: LayoutDashboard },
  { href: routes.adminNavigator, label: "Навигатор", icon: Compass },
  { href: routes.adminPractices, label: "Практики", icon: ListChecks },
  { href: routes.adminLibrary, label: "Библиотека", icon: Library },
  { href: routes.adminMatetis, label: "Матэтисы", icon: Users, adminOnly: true },
];

const roleLabels: Record<PersonRole, string> = {
  admin: "Администратор",
  content_manager: "Контент-менеджер",
  user: "Ученик",
};


export function AdminShell({ children, role }: { children: ReactNode; role: PersonRole }) {
  const pathname = usePathname();
  const nav = allNav.filter((item) => role === "admin" || !item.adminOnly);

  return (
    <div className="flex min-h-dvh bg-muted/40">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-background p-4 md:flex">
        <Link href={routes.admin} className="mb-8 flex items-center gap-2 px-2 font-semibold">
          <span className="grid size-7 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            {APP_NAME.charAt(0)}
          </span>
          <span className="tracking-[0.18em]">{APP_NAME}</span>
        </Link>
        <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Админка
        </p>
        <nav aria-label="Разделы админки">
          <ul className="space-y-1">
            {nav.map((item) => {
              const active = pathname === item.href || (item.href !== routes.admin && pathname.startsWith(`${item.href}/`));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-auto space-y-2">
          <Link
            href={routes.adminPassword}
            className={buttonVariants({ variant: "ghost", className: "w-full justify-start text-muted-foreground" })}
          >
            <LockKeyhole />
            Сменить пароль
          </Link>
          <Link
            href={routes.program}
            target="_blank"
            className={buttonVariants({ variant: "outline", className: "w-full justify-start" })}
          >
            <ExternalLink />
            Открыть приложение
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b bg-background px-6 py-3">
          <nav aria-label="Разделы админки" className="flex gap-1 overflow-x-auto md:hidden">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm",
                  pathname === item.href ? "bg-primary/10 text-primary" : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <span className="hidden md:block" />
          <div className="flex shrink-0 items-center gap-2 text-sm">
            <span className="grid size-8 place-items-center rounded-full bg-primary/10 font-medium text-primary">
              {roleLabels[role].charAt(0)}
            </span>
            <span className="hidden sm:inline">{roleLabels[role]}</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
