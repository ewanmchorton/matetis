import Link from "next/link";
import { CheckCircle2, Clock, PlayCircle } from "lucide-react";

import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";

import type { Practice } from "../model/types";

export function PracticeCard({
  practice,
  done = false,
  meta,
}: {
  practice: Practice;
  done?: boolean;
  meta?: string;
}) {
  return (
    <Link
      href={routes.practice(practice.id)}
      className={cn(
        "group flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40",
        done && "opacity-70",
      )}
    >
      <div className="min-w-0 flex-1">
        {meta && (
          <p className="mb-1 text-xs font-medium text-muted-foreground">{meta}</p>
        )}
        <p className="font-medium leading-snug group-hover:text-primary">
          {practice.title}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {practice.summary}
        </p>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {practice.durationMin} мин
          </span>
          {practice.video && (
            <span className="inline-flex items-center gap-1">
              <PlayCircle className="size-3.5" />
              видео
            </span>
          )}
        </div>
      </div>
      {done && (
        <CheckCircle2 className="size-5 shrink-0 text-primary" aria-label="Выполнено" />
      )}
    </Link>
  );
}
