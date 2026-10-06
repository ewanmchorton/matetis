"use client";

import Link from "next/link";
import { Check } from "lucide-react";

import { ElementBadge, getElement } from "@/entities/element";
import type { SupportPractice } from "@/entities/practice";
import { progressActions } from "@/entities/progress";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";

export function SupportPractices({
  items,
  doneIds,
  showVariantLink = false,
}: {
  items: SupportPractice[];
  doneIds: string[];
  showVariantLink?: boolean;
}) {
  const element = getElement("wood");

  return (
    <section aria-labelledby="support-title" className="space-y-3">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="support-title" className="text-lg font-semibold">
            Дополнительно
          </h2>
          <ElementBadge element={element} />
        </div>
        <p className="text-sm text-muted-foreground">
          Несколько практик к основной программе. Они не зависят от сезона и не заменяют практику дня.
        </p>
      </div>
      <ul className="space-y-3">
        {items.map((item) => {
          const done = doneIds.includes(item.id);
          return (
            <li
              key={item.id}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-4 transition-colors",
                done ? "bg-muted/60" : "bg-card",
              )}
            >
              <div className={cn("min-w-0 flex-1", done && "opacity-50")}>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {item.duration} · {item.note}
                </p>
              </div>
              <button
                type="button"
                aria-pressed={done}
                aria-label={done ? `Снять отметку «${item.title}»` : `Отметить «${item.title}»`}
                onClick={() => progressActions.toggleSupport(item.id)}
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-full border-2 transition-colors",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input text-transparent hover:border-primary/50 hover:text-primary/40",
                )}
              >
                <Check className="size-5" />
              </button>
            </li>
          );
        })}
      </ul>
      {showVariantLink && (
        <Link href={`${routes.birth}?view=square`} className={buttonVariants({ variant: "ghost", className: "px-0" })}>
          Вариант с квадратом и пояснением
        </Link>
      )}
    </section>
  );
}
