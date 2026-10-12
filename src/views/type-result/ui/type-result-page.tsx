"use client";

import Link from "next/link";

import { getCurrentElement } from "@/entities/element";
import { getPersonType, TypeTraits } from "@/entities/person-type";
import { useProgress } from "@/entities/progress";
import { routes } from "@/shared/config/routes";
import { buttonVariants } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";

export function TypeResultPage() {
  const { typeId } = useProgress();
  const type = getPersonType(typeId ?? "t1");
  const element = getCurrentElement();

  return (
    <main className="flex flex-1 flex-col gap-8 px-5 py-8">
      <Logo href={routes.auth} />
      {type && (
        <div className="space-y-6 rounded-3xl bg-gradient-to-br from-primary/10 via-card to-amber-50 p-6 dark:to-card">
          <p className="text-sm font-medium text-primary">Ваш психотип</p>
          <div className="space-y-1">
            <p className="text-6xl font-semibold tabular-nums text-primary/30">{type.number}</p>
            <h1 className="text-3xl font-semibold">{type.name}</h1>
          </div>
          <TypeTraits type={type} />
        </div>
      )}
      <div className="space-y-2 rounded-2xl border bg-card p-5">
        <p className="font-medium">Ваша программа готова</p>
        <p className="text-sm text-muted-foreground">
          Мы подобрали практики для типа «{type?.name}» на стихию {element.name}. Когда
          стихия сменится, программа обновится сама.
        </p>
      </div>
      <div className="mt-auto flex flex-col gap-3">
        <Link
          href={routes.program}
          className={buttonVariants({ size: "lg", className: "h-12 w-full text-base" })}
        >
          Перейти к программе
        </Link>
        <Link
          href={routes.auth}
          className={buttonVariants({ variant: "ghost", className: "w-full" })}
        >
          Начать первый вход сначала
        </Link>
      </div>
    </main>
  );
}
