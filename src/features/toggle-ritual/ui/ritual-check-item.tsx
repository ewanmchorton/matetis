"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { Practice } from "@/entities/practice";
import { progressActions, useProgress } from "@/entities/progress";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Checkbox } from "@/shared/ui/checkbox";

export function RitualCheckItem({ ritual }: { ritual: Practice }) {
  const { completedRitualIds } = useProgress();
  const done = completedRitualIds.includes(ritual.id);

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <Checkbox
        className="size-5"
        checked={done}
        onCheckedChange={() => progressActions.toggleRitual(ritual.id)}
        aria-label={`Отметить «${ritual.title}»`}
      />
      <Link href={routes.practice(ritual.id)} className="group flex min-w-0 flex-1 items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className={cn("truncate font-medium", done && "text-muted-foreground line-through")}>
            {ritual.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {ritual.weekday} · {ritual.durationMin} мин
          </p>
        </div>
        <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground" />
      </Link>
    </div>
  );
}
