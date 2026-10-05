import Link from "next/link";

import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";

export function ProgramStats({
  headline,
  encouragement,
  note,
}: {
  headline: string;
  encouragement: string;
  note: string;
}) {
  return (
    <section aria-labelledby="stats-title" className="space-y-3 rounded-2xl border bg-card p-4">
      <h2 id="stats-title" className="text-lg font-semibold">
        На этой неделе
      </h2>
      <p className="text-2xl font-semibold tabular-nums leading-tight text-primary">{headline}</p>
      <p className="text-sm leading-relaxed text-foreground">{encouragement}</p>
      <p className="text-sm text-muted-foreground">{note}</p>
      <Link
        href={routes.profile}
        className={cn(buttonVariants({ variant: "link" }), "h-auto p-0 text-sm")}
      >
        Подробная статистика в профиле
      </Link>
    </section>
  );
}
