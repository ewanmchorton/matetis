import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getCurrentElement } from "@/entities/element";
import { getPersonType } from "@/entities/person-type";
import { getProgram } from "@/entities/practice";
import type { Student } from "@/entities/student";
import { routes } from "@/shared/config/routes";
import { formatDate } from "@/shared/lib/format-date";
import { cn } from "@/shared/lib/utils";
import { PageHeader } from "@/shared/ui/page-header";
import { StatCard } from "@/shared/ui/stat-card";

export function AdminUserDetailPage({ student }: { student: Student }) {
  const type = student.typeId ? getPersonType(student.typeId) : undefined;
  const { daily, rituals } = getProgram(student.typeId ?? "t1", getCurrentElement().id);

  return (
    <>
      <Link
        href={routes.admin.users}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Пользователи
      </Link>
      <PageHeader title={student.name} description={student.email} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Тип" value={type?.name ?? "—"} hint={type ? `№${type.number}` : "тест не пройден"} />
        <StatCard label="Выполнено практик" value={`${student.practicesDone}/${student.practicesTotal}`} />
        <StatCard label="Ритуалы" value={`${student.ritualsDone}/${student.ritualsTotal}`} />
        <StatCard label="Последняя активность" value={formatDate(student.lastActiveAt)} />
      </div>

      <section className="rounded-xl border bg-card p-4 sm:p-5">
        <h2 className="mb-3 font-semibold">Программа текущей стихии</h2>
        <ul className="divide-y text-sm">
          {[
            ...daily.map((p, i) => ({ p, done: i < student.practicesDone })),
            ...rituals.map((p, i) => ({ p, done: i < student.ritualsDone })),
          ].map(({ p, done }) => {
            return (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                <span>
                  {p.title}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {p.kind === "ritual" ? "ритуал" : "ежедневная"}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs",
                    done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? "выполнено" : "не выполнено"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
