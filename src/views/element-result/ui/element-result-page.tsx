"use client";

import Link from "next/link";
import { Award } from "lucide-react";

import { ElementBadge, getCurrentElement } from "@/entities/element";
import { routes } from "@/shared/config/routes";
import { buttonVariants } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";

export function ElementResultPage({ earned }: { earned: boolean }) {
  const element = getCurrentElement();
  const percent = earned ? 74 : 54;

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 py-8">
      <Logo href={routes.program} />
      <p className="text-sm text-muted-foreground">
        Так выглядит конец периода стихии. Сейчас период ещё идёт — живой процент есть в профиле.
      </p>
      <section className="space-y-4 rounded-3xl border bg-card p-6 text-center">
        {earned ? (
          <span className="mx-auto grid size-20 place-items-center rounded-full bg-sky-100 text-sky-800">
            <Award className="size-9" />
          </span>
        ) : (
          <div className="flex justify-center">
            <ElementBadge element={element} />
          </div>
        )}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">
            {earned ? `Бейдж стихии ${element.name}` : `Период стихии ${element.name} завершён`}
          </h1>
          <p className="text-sm text-muted-foreground">Выполнено {percent}% программы периода</p>
        </div>
        {!earned && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Следующая стихия начнётся со своей программой.
          </p>
        )}
      </section>
      <div className="mt-auto flex flex-col gap-3">
        <Link href={routes.typeTest} className={buttonVariants({ size: "lg", className: "h-12 w-full text-base" })}>
          Пройти тест ещё раз
        </Link>
        <Link href={routes.program} className={buttonVariants({ variant: "outline", className: "w-full" })}>
          К программе
        </Link>
      </div>
    </main>
  );
}
