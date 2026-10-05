"use client";

import Link from "next/link";
import { useState } from "react";

import { ElementBadge, getCurrentElement } from "@/entities/element";
import { getWeeklyRituals } from "@/entities/practice";
import { getPersonType, TypeTraits } from "@/entities/person-type";
import {
  countPracticesInWeek,
  getProfileStatsSummary,
  useProgress,
} from "@/entities/progress";
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
            Тип, стихия, статистика и настройки.
          </p>
        </div>
      </header>

      <section className="space-y-3 rounded-2xl border bg-card p-4">
        <p className="text-sm font-medium text-primary">Аккаунт</p>
        <p className="text-lg font-semibold">Анна</p>
        <p className="text-sm text-muted-foreground">anna@example.ru</p>
        <p className="text-xs text-muted-foreground">
          В прототипе данные не отправляются на сервер.
        </p>
      </section>

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
    </main>
  );
}

function ProfileStats({ completedPractices }: { completedPractices: string[] }) {
  const weekDays = getWeekDays(new Date());
  const thisWeek = countPracticesInWeek(completedPractices, weekDays);
  const { lines } = getProfileStatsSummary(completedPractices, weekDays);

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
          <p className="text-2xl font-semibold tabular-nums">{thisWeek}</p>
          <p className="text-xs text-muted-foreground">на этой неделе</p>
        </div>
      </div>
      <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}

function ProfileRituals({ ritualMarks }: { ritualMarks: Record<string, string[]> }) {
  const today = new Date();
  const weekStart = getWeekStartKey(today);
  const weekDays = getWeekDays(today);
  const weekKeys = new Set(weekDays.map((d) => toDateKey(d)));
  const rituals = getWeeklyRituals(getCurrentElement().id);

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
              ? `${marks.filter((d) => weekKeys.has(d)).length} дн. с отметкой`
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
