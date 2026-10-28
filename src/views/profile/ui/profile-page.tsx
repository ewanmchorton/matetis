"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { ElementBadge, getCurrentElement } from "@/entities/element";
import { filterRituals, usePracticeCatalog } from "@/entities/practice";
import { getPersonType } from "@/entities/person-type";
import { PhraseSettings } from "@/features/phrase-notifications";
import { countInLastDays, getElementBadgeProgress, pluralRu, progressActions, useProgress } from "@/entities/progress";
import { authClient } from "@/shared/auth/client";
import { isStaticPrototype } from "@/shared/config/env";
import { routes } from "@/shared/config/routes";
import { getWeekDays, getWeekStartKey, toDateKey } from "@/shared/lib/date";
import { typograph } from "@/shared/lib/typograph";
import { useIsClient } from "@/shared/lib/use-is-client";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { CardInset, GlassCard } from "@/shared/ui/glass-card";
import { ScreenLayout } from "@/widgets/screen-layout";

import { useProfile } from "../api/profile-api";
import { ProfileFriends } from "./profile-friends";

const checkboxClass = "size-6 rounded-md border-primary/40 bg-background/70 [&_svg]:size-4!";

export function ProfilePage() {
  const router = useRouter();
  const { state, actionError, setPublishEvents, setPhraseSettings, answerRequest } = useProfile();

  useEffect(() => {
    if (state.status === "signed-out") router.replace(routes.auth);
  }, [state.status, router]);

  async function signOut() {
    if (!isStaticPrototype) await authClient.signOut();
    router.push(routes.auth);
  }

  return (
    <ScreenLayout variant="page" background="06_profile" title="Профиль">
      {state.status === "error" && (
        <GlassCard>
          <p role="alert" className="type-secondary text-destructive">
            {typograph(state.message)}
          </p>
        </GlassCard>
      )}

      {state.status === "ready" ? (
        <GlassCard aria-label="Вы и друзья" className="space-y-4">
          <h2 className="type-section">{state.data.me.name}</h2>
          {state.demo && !isStaticPrototype && (
            <p className="type-caption text-muted-foreground">{typograph("Вы не вошли — показаны демо-данные.")}</p>
          )}
          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
            <span className="type-secondary text-muted-foreground">{typograph("Делиться прогрессом с друзьями")}</span>
            <Checkbox
              className={checkboxClass}
              aria-label="Делиться прогрессом с друзьями"
              checked={state.data.settings.publishEvents}
              onCheckedChange={(value) => void setPublishEvents(value === true)}
            />
          </label>
          <ProfileFriends
            friends={state.data.friends}
            incoming={state.data.incoming}
            onAnswer={(personId, action) => void answerRequest(personId, action)}
          />
          {actionError && (
            <p role="alert" className="type-caption text-destructive">
              {typograph(actionError)}
            </p>
          )}
        </GlassCard>
      ) : (
        state.status === "loading" && <GlassCard aria-hidden className="h-56 animate-pulse" />
      )}

      <ProgressSections />

      <Reminders>
        {state.status === "ready" && (
          <PhraseSettings value={state.data.settings} demo={state.demo} onChange={setPhraseSettings} />
        )}
      </Reminders>

      {state.status === "ready" && (
        <GlassCard aria-labelledby="profile-settings-title" className="space-y-4">
          <h2 id="profile-settings-title" className="type-section">
            Настройки профиля
          </h2>
          <dl className="divide-y divide-border/70">
            <SettingRow label="Имя" value={state.data.me.name} />
            <SettingRow label="E-mail" value={state.data.me.email} />
            <SettingRow label="Пароль" value="••••••••" />
          </dl>
          <BirthDateField />
          <Button variant="ghost" size="cta" className="text-primary" onClick={() => void signOut()}>
            Выйти из аккаунта
          </Button>
        </GlassCard>
      )}
    </ScreenLayout>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 py-2">
      <dt className="type-secondary text-muted-foreground">{label}</dt>
      <dd className="truncate type-secondary text-foreground">{value}</dd>
    </div>
  );
}

// Ниже — разделы, которые пока работают на данных прототипа в браузере.
// Их подключат к серверу на этапах 5–7 (тест и тип, программа, статистика).

function ProgressSections() {
  const isClient = useIsClient();
  const { typeId, completedPractices, ritualMarks } = useProgress();
  const type = getPersonType(typeId ?? "t1");
  const element = getCurrentElement();

  if (!isClient) return <GlassCard aria-hidden className="h-40 animate-pulse" />;

  return (
    <>
      <ProfileStats completedPractices={completedPractices} />
      <ElementProgressCard completedPractices={completedPractices} ritualMarks={ritualMarks} />

      {type && (
        <GlassCard aria-label="Ваш психотип" className="space-y-3">
          <p className="type-secondary text-primary">Ваш психотип</p>
          <h2 className="type-section">
            {type.number}. {type.name}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {type.traits.map((trait) => (
              <li key={trait} className="rounded-full bg-secondary/70 px-3 py-1.5 type-secondary text-foreground">
                {typograph(trait)}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-2">
            <span className="type-secondary text-muted-foreground">Текущая стихия</span>
            <ElementBadge element={element} />
          </div>
        </GlassCard>
      )}

      <ProfileRituals ritualMarks={ritualMarks} />
    </>
  );
}

function ProfileStats({ completedPractices }: { completedPractices: string[] }) {
  const lastWeek = countInLastDays(completedPractices, new Date());

  return (
    <GlassCard aria-labelledby="profile-stats-title" className="space-y-4">
      <h2 id="profile-stats-title" className="type-section">
        Статистика
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <CardInset>
          <p className="type-section tabular-nums">{completedPractices.length}</p>
          <p className="type-caption text-muted-foreground">{typograph("практик дня всего")}</p>
        </CardInset>
        <CardInset>
          <p className="type-section tabular-nums">{lastWeek}</p>
          <p className="type-caption text-muted-foreground">{typograph("за последние 7 дней")}</p>
        </CardInset>
      </div>
    </GlassCard>
  );
}

function ElementProgressCard({
  completedPractices,
  ritualMarks,
}: {
  completedPractices: string[];
  ritualMarks: Record<string, string[]>;
}) {
  const element = getCurrentElement();
  const rituals = filterRituals(usePracticeCatalog().rituals, element.id);
  const progress = getElementBadgeProgress(completedPractices, ritualMarks, rituals, new Date());

  return (
    <GlassCard aria-labelledby="element-progress-title" className="space-y-3">
      <h2 id="element-progress-title" className="type-section">
        Прогресс стихии
      </h2>
      <div className="space-y-2">
        <div className="flex items-center justify-between type-secondary">
          <span className="text-foreground">{element.name}</span>
          <span className="tabular-nums text-muted-foreground">{progress.percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary" aria-hidden>
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress.percent}%` }} />
        </div>
      </div>
    </GlassCard>
  );
}

function dailyRitualLabel(days: number): string {
  if (days === 0) return "пока не отмечено";
  return `отмечено ${days} ${pluralRu(days, "день", "дня", "дней")}`;
}

function ProfileRituals({ ritualMarks }: { ritualMarks: Record<string, string[]> }) {
  const today = new Date();
  const weekStart = getWeekStartKey(today);
  const weekKeys = new Set(getWeekDays(today).map((d) => toDateKey(d)));
  const rituals = filterRituals(usePracticeCatalog().rituals, getCurrentElement().id);

  return (
    <GlassCard aria-labelledby="profile-rituals-title" className="space-y-3">
      <h2 id="profile-rituals-title" className="type-section">
        Ритуалы на этой неделе
      </h2>
      <ul className="divide-y divide-border/70">
        {rituals.map((ritual) => {
          const marks = ritualMarks[ritual.id] ?? [];
          const label =
            ritual.schedule === "daily"
              ? dailyRitualLabel(marks.filter((d) => weekKeys.has(d)).length)
              : marks.includes(weekStart)
                ? "отмечено на этой неделе"
                : "ещё не отмечено";
          return (
            <li key={ritual.id} className="flex justify-between gap-3 py-2.5 type-secondary">
              <span className="text-muted-foreground">{typograph(ritual.title)}</span>
              <span className="shrink-0 text-right text-foreground">{typograph(label)}</span>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}

/** children — пункты, которые хранятся на сервере (фраза дня). */
function Reminders({ children }: { children?: ReactNode }) {
  const [morning, setMorning] = useState(true);
  const [evening, setEvening] = useState(false);

  return (
    <GlassCard aria-labelledby="profile-reminders-title" className="space-y-2">
      <h2 id="profile-reminders-title" className="type-section">
        Напоминания
      </h2>
      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <Checkbox className={checkboxClass} aria-label="Утреннее напоминание" checked={morning} onCheckedChange={(v) => setMorning(v === true)} />
        <span className="type-secondary text-foreground">{typograph("Утром — напоминание о практике дня")}</span>
      </label>
      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <Checkbox className={checkboxClass} aria-label="Вечернее напоминание" checked={evening} onCheckedChange={(v) => setEvening(v === true)} />
        <span className="type-secondary text-foreground">{typograph("Вечером — размышление или медитация")}</span>
      </label>
      {children}
    </GlassCard>
  );
}

function BirthDateField() {
  const isClient = useIsClient();
  const { birthDate } = useProgress();

  return (
    <div className="grid gap-1.5">
      <label htmlFor="birth-date" className="type-secondary text-muted-foreground">
        Дата рождения
      </label>
      {isClient ? (
        <input
          id="birth-date"
          type="date"
          className="block h-(--field-height) w-full min-w-0 max-w-full appearance-none rounded-2xl border border-input bg-background/70 px-4 py-0 text-left type-body leading-[calc(var(--field-height)-2px)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-date-and-time-value]:m-0 [&::-webkit-date-and-time-value]:text-left [&::-webkit-date-and-time-value]:leading-[calc(var(--field-height)-2px)]"
          value={birthDate ?? ""}
          onChange={(event) => progressActions.setBirthDate(event.target.value || null)}
        />
      ) : (
        <div className="h-(--button-height) animate-pulse rounded-2xl bg-secondary" aria-hidden />
      )}
    </div>
  );
}
