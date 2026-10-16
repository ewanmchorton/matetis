import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";

type TextFieldProps = ComponentProps<"input"> & {
  id: string;
  label: string;
  /** Текст ошибки под полем. */
  error?: string;
  /** Плотнее: подпись 13 px, поле 40 px — для длинных форм вроде регистрации. */
  compact?: boolean;
};

/** Поле ввода с подписью. Высота 44 px — минимум для нажатия пальцем. */
export function TextField({ id, label, error, compact = false, className, ...props }: TextFieldProps) {
  return (
    <div className={cn("grid", compact ? "gap-0.5" : "gap-1")}>
      <label
        htmlFor={id}
        className={cn(compact ? "type-caption font-normal" : "type-secondary leading-tight", "text-muted-foreground")}
      >
        {label}
      </label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          compact ? "h-10 rounded-[14px]" : "h-(--field-height) rounded-2xl",
          "border-input bg-background/70 px-4 type-body backdrop-blur-sm md:text-[17px]",
          className,
        )}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="type-caption text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
