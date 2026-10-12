import Link from "next/link";

import { APP_NAME } from "@/shared/config/brand";
import { cn } from "@/shared/lib/utils";

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 font-semibold", className)}>
      <span className="grid size-7 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
        {APP_NAME.charAt(0)}
      </span>
      <span className="tracking-[0.18em]">{APP_NAME}</span>
    </Link>
  );
}
