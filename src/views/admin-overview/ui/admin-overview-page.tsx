"use client";

import Link from "next/link";
import { ArrowRight, Library, ListChecks, Users } from "lucide-react";

import { ElementBadge, getCurrentElement } from "@/entities/element";
import { useLibraryItems } from "@/entities/library";
import { filterRituals, usePracticeCatalog } from "@/entities/practice";
import { getStudents } from "@/entities/student";
import { routes } from "@/shared/config/routes";

export function AdminOverviewPage() {
  const element = getCurrentElement();
  const items = useLibraryItems();
  const catalog = usePracticeCatalog();
  const students = getStudents();
  const activeThisWeek = students.filter((s) => s.practicesThisWeek > 0).length;
  const practices = catalog.practices.filter((p) => p.elementId === element.id);
  const rituals = filterRituals(catalog.rituals, element.id);

  const cards = [
    {
      href: routes.adminStudents,
      icon: Users,
      value: students.length,
      label: "учеников",
      hint: `${activeThisWeek} отмечали практики на этой неделе`,
    },
    {
      href: routes.adminMaterials,
      icon: Library,
      value: items.length,
      label: "материалов в библиотеке",
      hint: "видео, медитации, книги, фильмы",
    },
    {
      href: routes.adminProgram,
      icon: ListChecks,
      value: practices.length + rituals.length,
      label: "практик и ритуалов",
      hint: `${practices.length} практик дня · ${rituals.length} ритуалов`,
    },
  ];

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Обзор</h1>
        <p className="text-sm text-muted-foreground">
          Наполнение приложения материалами и программой.
        </p>
      </div>

      <section className="flex flex-wrap items-center gap-3 rounded-2xl border bg-background p-5">
        <span className="text-sm text-muted-foreground">Текущая стихия</span>
        <ElementBadge element={element} className="text-sm" />
        <span className="text-sm">с 1 декабря · {element.season.toLowerCase()}</span>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group space-y-3 rounded-2xl border bg-background p-5 transition-colors hover:border-primary/40"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <card.icon className="size-5" />
            </span>
            <div>
              <p className="text-3xl font-semibold tabular-nums">{card.value}</p>
              <p className="text-sm">{card.label}</p>
            </div>
            <p className="flex items-center justify-between text-xs text-muted-foreground">
              {card.hint}
              <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </p>
          </Link>
        ))}
      </section>

      <section className="space-y-3 rounded-2xl border bg-background p-5">
        <h2 className="font-semibold">Как это работает</h2>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>В разделе «Материалы» добавьте видео, медитацию, книгу или фильм.</li>
          <li>В разделе «Практики и ритуалы» — практику дня или еженедельный ритуал.</li>
          <li>
            Откройте приложение — новые материалы сразу видны в библиотеке, практики — на экране
            программы.
          </li>
        </ol>
      </section>
    </>
  );
}
