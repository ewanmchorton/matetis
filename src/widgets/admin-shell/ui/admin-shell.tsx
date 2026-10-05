"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";

import { adminNav } from "@/shared/config/navigation";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/shared/ui/sheet";

const isActive = (pathname: string, href: string) =>
  href === routes.admin.dashboard
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {adminNav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            isActive(pathname, item.href) && "bg-muted font-medium text-foreground",
          )}
        >
          <item.icon className="size-4" />
          {item.title}
        </Link>
      ))}
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r bg-sidebar p-4 lg:flex">
        <div>
          <Logo href={routes.admin.dashboard} />
          <p className="mt-1 pl-9 text-xs text-muted-foreground">Кабинет Мастера</p>
        </div>
        <NavLinks />
        <Link
          href={routes.map}
          className="mt-auto text-xs text-muted-foreground hover:text-foreground"
        >
          ← Карта экранов
        </Link>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur lg:hidden">
          <Logo href={routes.admin.dashboard} />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Меню" />}>
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="p-4">
              <SheetTitle className="mb-2">Кабинет Мастера</SheetTitle>
              <NavLinks onNavigate={() => setOpen(false)} />
              <Link href={routes.map} className="mt-4 text-xs text-muted-foreground">
                ← Карта экранов
              </Link>
            </SheetContent>
          </Sheet>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
