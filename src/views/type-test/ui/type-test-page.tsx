import Link from "next/link";

import { getTypeTest } from "@/entities/type-test";
import { TypeTestFlow, type TestVariant } from "@/features/take-type-test";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Logo } from "@/shared/ui/logo";

const variants: { id: TestVariant; title: string }[] = [
  { id: "steps", title: "По шагам" },
  { id: "page", title: "Одной страницей" },
];

export function TypeTestPage({ variant }: { variant: TestVariant }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-5 py-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Logo href={routes.onboarding} />
        <div
          className="inline-flex rounded-lg bg-muted p-0.5 text-xs"
          role="group"
          aria-label="Вариант теста (для сравнения в прототипе)"
        >
          {variants.map((v) => (
            <Link
              key={v.id}
              href={`${routes.typeTest}?variant=${v.id}`}
              className={cn(
                "rounded-md px-2.5 py-1 text-muted-foreground",
                variant === v.id && "bg-background font-medium text-foreground shadow-sm",
              )}
            >
              {v.title}
            </Link>
          ))}
        </div>
      </div>
      <TypeTestFlow key={variant} test={getTypeTest()} variant={variant} />
    </main>
  );
}
