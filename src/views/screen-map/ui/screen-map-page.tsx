import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { screenMap } from "@/shared/config/navigation";
import { cn } from "@/shared/lib/utils";
import { Logo } from "@/shared/ui/logo";

export function ScreenMapPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-10 sm:py-16">
      <div className="space-y-4">
        <Logo />
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Кликабельный прототип приложения для учеников Мастера
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Все данные выдуманные и хранятся только в вашем браузере. Отметки выполнения
          сохраняются между переходами, изменения в кабинете администратора — нет.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {screenMap.map((group) => (
          <section key={group.title} className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
            <div>
              <h2 className="font-semibold">{group.title}</h2>
              <p className="text-sm text-muted-foreground">{group.description}</p>
            </div>
            <ul className="flex flex-col">
              {group.screens.map((s) => (
                <li key={`${s.title}-${s.href}`}>
                  <Link
                    href={s.href}
                    className={cn(
                      "group flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted",
                      s.depth ? "ml-4 border-l pl-3 text-muted-foreground" : "font-medium",
                    )}
                  >
                    {s.title}
                    <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
