"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { CompanionImage } from "@/entities/companion";
import { ElementBadge, getCurrentElement } from "@/entities/element";
import { getPersonType } from "@/entities/person-type";
import { PhraseSettings } from "@/features/phrase-notifications";
import { authClient } from "@/shared/auth/client";
import { isTelegramContact } from "@/shared/auth/contact";
import { isStaticPrototype } from "@/shared/config/env";
import { routes } from "@/shared/config/routes";
import { typograph } from "@/shared/lib/typograph";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { GlassCard } from "@/shared/ui/glass-card";
import { ScreenLayout } from "@/widgets/screen-layout";

import { useJournal } from "../api/journal-api";
import { useProfile } from "../api/profile-api";
import { ProfileFriends } from "./profile-friends";
import { ProfileJournal } from "./profile-journal";

const checkboxClass = "size-6 rounded-md border-primary/40 bg-background/70 [&_svg]:size-4!";

export function ProfilePage() {
  const router = useRouter();
  const { state, actionError, setPhraseSettings, setBirthDate, answerRequest } = useProfile();
  const journal = useJournal();

  useEffect(() => {
    if (state.status === "signed-out") router.replace(routes.auth);
  }, [state.status, router]);

  async function signOut() {
    if (!isStaticPrototype) await authClient.signOut();
    router.push(routes.auth);
  }

  return (
    <ScreenLayout variant="page" background="09_profile" title="Профиль">
      {state.status === "error" && (
        <GlassCard>
          <p role="alert" className="type-secondary text-destructive">
            {typograph(state.message)}
          </p>
        </GlassCard>
      )}

      {state.status === "ready" ? (
        <GlassCard aria-label="Вы и друзья" className="space-y-4">
          <div className="flex flex-col items-center">
            <CompanionImage stage={state.data.me.companionStage} className="size-52" />
            <h2 className="mt-2 text-center type-section">{state.data.me.name}</h2>
          </div>
          {state.demo && !isStaticPrototype && (
            <p className="type-caption text-muted-foreground">{typograph("Вы не вошли – показаны демо-данные.")}</p>
          )}
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
        state.status === "loading" && <GlassCard aria-hidden className="h-96 animate-pulse" />
      )}

      {state.status === "ready" && <PersonTypeCard typeId={state.data.me.typeId} />}

      <ProfileJournal state={journal} />

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
            <SettingRow
              label={state.data.me.contact && isTelegramContact(state.data.me.contact) ? "Telegram" : "E-mail"}
              value={state.data.me.contact ?? ""}
            />
          </dl>
          <BirthDateField value={state.data.me.birthDate} onChange={(value) => void setBirthDate(value)} />
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

function PersonTypeCard({ typeId }: { typeId: string | null }) {
  const type = typeId ? getPersonType(typeId) : undefined;
  const element = getCurrentElement();

  if (!type) return null;

  return (
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
  );
}

/** children – пункты, которые хранятся на сервере (фраза дня). */
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
        <span className="type-secondary text-foreground">{typograph("Утром – напоминание о практике дня")}</span>
      </label>
      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <Checkbox className={checkboxClass} aria-label="Вечернее напоминание" checked={evening} onCheckedChange={(v) => setEvening(v === true)} />
        <span className="type-secondary text-foreground">{typograph("Вечером – размышление или медитация")}</span>
      </label>
      {children}
    </GlassCard>
  );
}

/** Календарь телефона. Пустое значение не сохраняем: дату рождения можно поменять, но не стереть. */
function BirthDateField({ value, onChange }: { value: string | null; onChange: (value: string) => void }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor="birth-date" className="type-secondary text-muted-foreground">
        Дата рождения
      </label>
      <input
        id="birth-date"
        type="date"
        className="block h-(--field-height) w-full min-w-0 max-w-full appearance-none rounded-2xl border border-input bg-background/70 px-4 py-0 text-left type-body leading-[calc(var(--field-height)-2px)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-date-and-time-value]:m-0 [&::-webkit-date-and-time-value]:text-left [&::-webkit-date-and-time-value]:leading-[calc(var(--field-height)-2px)]"
        value={value ?? ""}
        onChange={(event) => {
          if (event.target.value) onChange(event.target.value);
        }}
      />
    </div>
  );
}
