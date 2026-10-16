import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

/**
 * Карточка поверх фоновой картинки: Ivory 68 %, тонкая светлая граница,
 * лёгкое размытие. docs/design-guide.md, раздел «Карточки».
 */
export function GlassCard({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-white/60 bg-background/68 p-5 shadow-[0_2px_12px_rgb(41_44_40/0.05)] backdrop-blur-[6px]",
        className,
      )}
      {...props}
    />
  );
}

/** Вложенная подложка внутри карточки: статистика, запрос в друзья. */
export function CardInset({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl bg-secondary/55 p-4", className)} {...props} />;
}
