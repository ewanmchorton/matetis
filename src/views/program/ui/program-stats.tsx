import Link from "next/link";

import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";

export function ProgramStats({ note }: { note: string }) {
  return (
    <section aria-labelledby="stats-title" className="rounded-2xl border bg-card p-4">
      <h2 id="stats-title" className="sr-only">
        Ваши достижения
      </h2>
      <p className="text-sm leading-relaxed text-muted-foreground">{note}</p>
      <Link
        href={routes.profile}
        className={cn(buttonVariants({ variant: "link" }), "mt-2 h-auto p-0 text-sm")}
      >
        Подробная статистика в профиле
      </Link>
    </section>
  );
}
