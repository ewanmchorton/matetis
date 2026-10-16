"use client";

import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";
import { TabsList, TabsTrigger } from "@/shared/ui/tabs";

/** Переключатель из двух-трёх вариантов (например, «Регистрация / Вход»). Используется внутри Tabs. */
export function SegmentedList({ className, ...props }: ComponentProps<typeof TabsList>) {
  return (
    <TabsList
      className={cn(
        "h-(--field-height)! w-full rounded-2xl bg-secondary/80 p-1 backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

export function SegmentedTrigger({ className, ...props }: ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger
      className={cn(
        "h-full rounded-xl type-button text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
