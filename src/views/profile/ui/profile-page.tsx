"use client";

import Link from "next/link";
import { useState } from "react";

import { ElementBadge, getCurrentElement } from "@/entities/element";
import { filterRituals, usePracticeCatalog } from "@/entities/practice";
import { getPersonType, TypeTraits } from "@/entities/person-type";
import { countInLastDays, pluralRu, useProgress } from "@/entities/progress";
import { routes } from "@/shared/config/routes";
import { getWeekDays, getWeekStartKey, toDateKey } from "@/shared/lib/date";
import { useIsClient } from "@/shared/lib/use-is-client";
import { buttonVariants } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";
import { Logo } from "@/shared/ui/logo";

export function ProfilePage() {
  const isClient = useIsClient();
  const { typeId, completedPractices, ritualMarks } = useProgress();
  const type = getPersonType(typeId ?? "t1");
  const element = getCurrentElement();
  const [remindMorning, setRemindMorning] = useState(true);
  const [remindEvening, setRemindEvening] = useState(false);

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pt-6 pb-8">
      <header className="space-y-4">
        <Logo href={routes.program} />
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Профиль</h1>
          <p className="text-sm text-muted-foreground">
            Тип, статистика, напоминания и настройки.
          </p>
        </div>
      </header>

      {type && (
        <section className="space-y-3 rounded-2xl border bg-card p-4">
          <p className="text-sm font-medium text-primary">Ваш психотип</p>
          <p className="text-xl font-semibold">
            {type.number}. {type.name}
          </p>
          <TypeTraits type={type} />
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Текущая стихия</span>
            <ElementBadge element={element} />
          </div>
          <Link href={routes.typeTest} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Пройти тест заново
          </Link>
        </section>
      )}

      {isClient ? (
        <>
          <ProfileStats completedPractices={completedPractices} />
          <ProfileRituals ritualMarks={ritualMarks} />
        </>
      ) : (
        <div className="h-40 animate-pulse rounded-2xl bg-muted" aria-hidden />
      )}

      <section className="space-y-4 rounded-2xl border bg-card p-4">
        <h2 className="text-lg font-semibold">Напоминания</h2>
        <p className="text-sm text-muted-foreground">
          В полной версии можно будет выбрать время. Сейчас — только демо-переключатели.
        </p>
        <Label className="flex items-start gap-3 font-normal">
          <Checkbox
            className="mt-0.5"
            checked={remindMorning}
            onCheckedChange={(v) => setRemindMorning(v === true)}
          />
          <span className="text-sm leading-snug">Утром — напоминание о практике дня</span>
        </Label>
        <Label className="flex items-start gap-3 font-normal">
          <Checkbox
            className="mt-0.5"
            checked={remindEvening}
            onCheckedChange={(v) => setRemindEvening(v === true)}
          />
          <span className="text-sm leading-snug">Вечером — размышление или медитация</span>
        </Label>
      </section>

      <section aria-labelledby="profile-settings-title" className="space-y-4 rounded-2xl border bg-card p-4">
        <h2 id="profile-settings-title" className="text-lg font-semibold">
          Настройки профиля
        </h2>
        <dl className="divide-y text-sm">
          <div className="flex justify-between gap-3 py-2.5">
            <dt className="text-muted-foreground">Имя</dt>
            <dd className="font-medium">Анна</dd>
          </div>
          <div className="flex justify-between gap-3 py-2.5">
            <dt className="text-muted-foreground">E-mail</dt>
            <dd className="font-medium">anna@example.ru</dd>
          </div>
          <div className="flex justify-between gap-3 py-2.5">
            <dt className="text-muted-foreground">Пароль</dt>
            <dd className="font-medium tracking-widest">••••••••</dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          В прототипе данные не отправляются на сервер.
        </p>
        <Link
          href={routes.auth}
          className={buttonVariants({ variant: "ghost", className: "w-full text-muted-foreground" })}
        >
          Выйти из аккаунта
        </Link>
      </section>
    </main>
  );
}

function ProfileStats({ completedPractices }: { completedPractices: string[] }) {
  const lastWeek = countInLastDays(completedPractices, new Date());

  return (
    <section aria-labelledby="profile-stats-title" className="space-y-4 rounded-2xl border bg-card p-4">
      <h2 id="profile-stats-title" className="text-lg font-semibold">
        Статистика
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-muted/60 p-3">
          <p className="text-2xl font-semibold tabular-nums">{completedPractices.length}</p>
          <p className="text-xs text-muted-foreground">практик дня всего</p>
        </div>
        <div className="rounded-xl bg-muted/60 p-3">
          <p className="text-2xl font-semibold tabular-nums">{lastWeek}</p>
          <p className="text-xs text-muted-foreground">за последние 7 дней</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Каждая отметка — это время, которое вы нашли для себя.
      </p>
    </section>
  );
}

function dailyRitualLabel(days: number): string {
  if (days === 0) return "пока не отмечено";
  return `отмечено ${days} ${pluralRu(days, "день", "дня", "дней")}`;
}

function ProfileRituals({ ritualMarks }: { ritualMarks: Record<string, string[]> }) {
  const today = new Date();
  const weekStart = getWeekStartKey(today);
  const weekDays = getWeekDays(today);
  const weekKeys = new Set(weekDays.map((d) => toDateKey(d)));
  const rituals = filterRituals(usePracticeCatalog().rituals, getCurrentElement().id);

  return (
    <section aria-labelledby="profile-rituals-title" className="space-y-3 rounded-2xl border bg-card p-4">
      <h2 id="profile-rituals-title" className="text-lg font-semibold">
        Ритуалы на этой неделе
      </h2>
      <ul className="space-y-2 text-sm">
        {rituals.map((ritual) => {
          const marks = ritualMarks[ritual.id] ?? [];
          const label =
            ritual.schedule === "daily"
              ? dailyRitualLabel(marks.filter((d) => weekKeys.has(d)).length)
              : marks.includes(weekStart)
                ? "отмечено на этой неделе"
                : "ещё не отмечено";
          return (
            <li key={ritual.id} className="flex justify-between gap-3 border-b border-border/60 pb-2 last:border-0">
              <span className="text-muted-foreground">{ritual.title}</span>
              <span className="shrink-0 text-right text-foreground">{label}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
