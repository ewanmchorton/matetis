import Link from "next/link";

import { APP_NAME } from "@/shared/config/brand";
import { cn } from "@/shared/lib/utils";

/**
 * Текстовый логотип. Размер и цвет — из docs/design-guide.md, раздел «Логотип».
 * Положение на экране задаёт ScreenLayout, а не сам логотип.
 */
export function Logo({ href, className }: { href?: string; className?: string }) {
  const text = (
    <span
      className={cn(
        "font-[family-name:var(--font-display)] text-[22px] leading-none font-medium tracking-[0.2em] text-primary",
        className,
      )}
    >
      {APP_NAME}
    </span>
  );
  return href ? <Link href={href}>{text}</Link> : text;
}
