"use client";

import { ElementBadge, getCurrentElement } from "@/entities/element";
import { getPersonType, TypeTraits } from "@/entities/person-type";
import { countPracticesInWeek, getProfileStatsSummary, useProgress } from "@/entities/progress";
import { routes } from "@/shared/config/routes";
import { getWeekDays } from "@/shared/lib/date";
import { useIsClient } from "@/shared/lib/use-is-client";
import { Logo } from "@/shared/ui/logo";

export function ProfilePage() {
  const isClient = useIsClient();
  const { typeId, completedPractices } = useProgress();
  const type = getPersonType(typeId ?? "t1");
  const element = getCurrentElement();

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pt-6 pb-8">
      <header className="space-y-4">
        <Logo href={routes.program} />
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Профиль</h1>
          <p className="text-sm text-muted-foreground">
            Ваш тип, стихия и спокойная статистика — без серий «дней подряд».
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
        </section>
      )}

      {isClient ? (
        <ProfileStats completedPractices={completedPractices} />
      ) : (
        <div className="h-40 animate-pulse rounded-2xl bg-muted" aria-hidden />
      )}

      <p className="text-sm text-muted-foreground">
        Настройки, напоминания и данные аккаунта появятся позже, когда подключим сервер.
      </p>
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
