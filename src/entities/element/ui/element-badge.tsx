import { cn } from "@/shared/lib/utils";

import type { Element } from "../model/types";

export function ElementBadge({
  element,
  className,
}: {
  element: Element;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        element.tone,
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {element.name}
    </span>
  );
}
