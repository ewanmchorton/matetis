"use client";

import Link from "next/link";
import { BarChart3 } from "lucide-react";

import { ElementBadge, getCurrentElement } from "@/entities/element";
import { getPersonType } from "@/entities/person-type";
import { useProgress } from "@/entities/progress";
import { routes } from "@/shared/config/routes";
import { buttonVariants } from "@/shared/ui/button";
import { ElementGuide } from "@/widgets/element-guide";
import { TodayPractice } from "@/widgets/today-practice";
import { WeeklyRituals } from "@/widgets/weekly-rituals";

export function ProgramPage() {
  const { typeId } = useProgress();
  const type = getPersonType(typeId ?? "t1");
  const element = getCurrentElement();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <ElementBadge element={element} />
            <span className="text-xs text-muted-foreground">
              {element.season} · {element.period}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Доброе утро, Анна
          </h1>
          <p className="text-sm text-muted-foreground">
            Программа для типа «{type?.name}» на стихию {element.name}
          </p>
        </div>
        <Link
          href={routes.profile}
          className={buttonVariants({ variant: "outline", size: "icon-lg" })}
          aria-label="Моя статистика"
        >
          <BarChart3 />
        </Link>
      </div>

      <TodayPractice />

      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <WeeklyRituals />
        <ElementGuide />
      </div>
    </div>
  );
}
