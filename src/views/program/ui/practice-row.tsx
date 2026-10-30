"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { typograph } from "@/shared/lib/typograph";
import { Checkbox } from "@/shared/ui/checkbox";

const checkboxClass = "size-6 rounded-md border-primary/40 bg-background/70 [&_svg]:size-4!";

/**
 * Строка практики: галочка «сделано», название, подпись. Стрелка — если у практики свой экран (href).
 * Без onDone галочку нажать нельзя: отметка ставится на экране практики.
 */
export function PracticeRow({
  title,
  meta,
  done,
  onDone,
  href,
}: {
  title: string;
  meta?: string;
  done: boolean;
  onDone?: (done: boolean) => void;
  href?: string;
}) {
  const text = (
    <span className="min-w-0 flex-1">
      <span className="block type-block text-foreground">{typograph(title)}</span>
      {meta && <span className="block type-caption text-muted-foreground">{meta}</span>}
    </span>
  );
  const arrow = <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />;

  return (
    <div className="flex min-h-14 items-center gap-4 py-2">
      <Checkbox
        className={`${checkboxClass} disabled:opacity-100`}
        aria-label={`${title}: сделано`}
        checked={done}
        disabled={!onDone}
        onCheckedChange={(value) => onDone?.(value === true)}
      />
      {href ? (
        <Link href={href} className="flex min-h-11 flex-1 items-center gap-3">
          {text}
          {arrow}
        </Link>
      ) : (
        text
      )}
    </div>
  );
}
