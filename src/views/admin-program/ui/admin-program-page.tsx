"use client";

import { Trash2 } from "lucide-react";

import { ElementBadge, getElement } from "@/entities/element";
import { practiceActions, usePracticeCatalog } from "@/entities/practice";
import { AddPracticeForm, AddRitualForm } from "@/features/manage-program";
import { Button } from "@/shared/ui/button";

export function AdminProgramPage() {
  const { practices, rituals } = usePracticeCatalog();

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Практики и ритуалы</h1>
        <p className="text-sm text-muted-foreground">
          Практики дня сменяют друг друга каждый день. Ритуалы показываются в блоке «Еженедельные
          ритуалы».
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Практики дня</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {practices.map((p) => (
            <li key={p.id} className="space-y-2 rounded-2xl border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium">{p.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ElementBadge element={getElement(p.elementId)} />
                    {p.duration} · шагов: {p.steps.length}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Удалить «${p.title}»`}
                  onClick={() => practiceActions.removePractice(p.id)}
                >
                  <Trash2 className="text-muted-foreground" />
                </Button>
              </div>
              {p.why && <p className="text-sm text-muted-foreground">{p.why}</p>}
            </li>
          ))}
        </ul>
        <AddPracticeForm />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Еженедельные ритуалы</h2>
        <ul className="divide-y rounded-2xl border bg-background">
          {rituals.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0 space-y-1">
                <p className="font-medium">{r.title}</p>
                <p className="text-sm text-muted-foreground">{r.description}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <ElementBadge element={getElement(r.elementId)} />
                <span className="w-32 text-sm text-muted-foreground">
                  {r.schedule === "daily" ? "Отметки по дням" : "Раз в неделю"}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Удалить «${r.title}»`}
                  onClick={() => practiceActions.removeRitual(r.id)}
                >
                  <Trash2 className="text-muted-foreground" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <AddRitualForm />
      </section>
    </>
  );
}
