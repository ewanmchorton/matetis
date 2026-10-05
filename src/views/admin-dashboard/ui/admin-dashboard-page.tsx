import Link from "next/link";
import { Activity, CheckCheck, PlayCircle, Repeat, UserPlus } from "lucide-react";

import { getCurrentElement } from "@/entities/element";
import { getAdminOverview, getStudents } from "@/entities/student";
import { routes } from "@/shared/config/routes";
import { formatDate } from "@/shared/lib/format-date";
import { PageHeader } from "@/shared/ui/page-header";
import { StatCard } from "@/shared/ui/stat-card";
import { TypeDistribution } from "@/widgets/type-distribution";

const later = [
  "Какие практики чаще всего пропускают",
  "Какие практики чаще всего выполняют",
  "На каком этапе ученики перестают проходить программу",
  "Активность по дням и неделям",
];

export function AdminDashboardPage() {
  const o = getAdminOverview();
  const recent = [...getStudents()]
    .sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt))
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title="Общая статистика"
        description={`Текущая стихия: ${getCurrentElement().name}. Данные демонстрационные.`}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Зарегистрировано" value={o.registered} icon={UserPlus} />
        <StatCard label="Активны за 7 дней" value={o.active} icon={Activity} />
        <StatCard label="Начали программу" value={`${o.startedPercent}%`} icon={PlayCircle} />
        <StatCard label="Среднее практик" value={o.avgPractices} icon={CheckCheck} hint="на ученика" />
        <StatCard label="Ритуалы" value={`${o.ritualsPercent}%`} icon={Repeat} hint="выполнено от плана" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <TypeDistribution byType={o.byType} />
        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Недавняя активность</h2>
              <Link href={routes.admin.students} className="text-sm text-primary hover:underline">
                Все ученики
              </Link>
            </div>
            <ul className="divide-y">
              {recent.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={routes.admin.student(s.id)} className="hover:underline">
                    {s.name}
                  </Link>
                  <span className="text-muted-foreground">{formatDate(s.lastActiveAt)}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-dashed p-4 sm:p-5">
            <h2 className="font-semibold">Появится позже</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {later.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
