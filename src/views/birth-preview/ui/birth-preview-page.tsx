"use client";

import Link from "next/link";

import { demoElementShares, demoSquare, demoTraits } from "@/entities/birth";
import { ElementBadge, getElement } from "@/entities/element";
import { filterSupport, usePracticeCatalog } from "@/entities/practice";
import { useProgress } from "@/entities/progress";
import { routes } from "@/shared/config/routes";
import { useIsClient } from "@/shared/lib/use-is-client";
import { cn } from "@/shared/lib/utils";
import { Logo } from "@/shared/ui/logo";
import { SupportPractices } from "@/views/program/ui/support-practices";

export function BirthPreviewPage({ view }: { view: "practices" | "square" }) {
  const isClient = useIsClient();
  const { supportDone } = useProgress();
  const support = filterSupport(usePracticeCatalog().support, "wood");

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pt-6 pb-8">
      <Logo href={routes.program} />
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Дата рождения</h1>
        <p className="text-sm text-muted-foreground">
          Два варианта для обсуждения. В программе по умолчанию показывается короткий.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1 text-center text-sm">
        <Link
          href={routes.birth}
          className={cn("rounded-full px-3 py-2", view === "practices" && "bg-background font-medium shadow-sm")}
        >
          Только практики
        </Link>
        <Link
          href={`${routes.birth}?view=square`}
          className={cn("rounded-full px-3 py-2", view === "square" && "bg-background font-medium shadow-sm")}
        >
          Квадрат
        </Link>
      </div>

      {view === "square" && <SquareVariant />}

      {isClient ? (
        <SupportPractices items={support} doneIds={supportDone} />
      ) : (
        <div className="h-40 animate-pulse rounded-2xl bg-muted" aria-hidden />
      )}

      <Link href={routes.program} className="text-sm text-primary">
        Вернуться к программе
      </Link>
    </main>
  );
}

function SquareVariant() {
  const max = Math.max(...demoElementShares.map((item) => item.value));

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-4">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Пример экрана. Формулу квадрата и правило слабой стихии ещё зафиксируем — цифры ниже
        выдуманные и не считаются из даты.
      </p>
      <div>
        <p className="mb-2 text-sm font-medium">Квадрат</p>
        <div className="grid grid-cols-3 gap-2" aria-label="Пример квадрата">
          {demoSquare.flat().map((cell, index) => (
            <div key={`${cell}-${index}`} className="grid h-14 place-items-center rounded-xl bg-muted text-lg font-semibold">
              {cell}
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Пример характеристик</p>
        <ul className="flex flex-wrap gap-2">
          {demoTraits.map((trait) => (
            <li key={trait} className="rounded-full bg-muted px-3 py-1 text-sm">
              {trait}
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Распределение по стихиям</p>
        <ul className="space-y-2">
          {demoElementShares.map((item) => {
            const element = getElement(item.id);
            const weak = item.id === "wood";
            return (
              <li key={item.id} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <ElementBadge element={element} />
                  <span className="text-xs text-muted-foreground">{weak ? "в примере — слабая" : item.value}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${(item.value / max) * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Если слабых стихий несколько и они равны, правило выбора ещё не зафиксировано. В примере
          слабая одна — Дерево, поэтому ниже практики именно для неё.
        </p>
      </div>
    </section>
  );
}
