"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Рисунки из design/icons. Обычная вкладка – как в файле, выбранная – цветом подписи. */
const tabs = [
  { href: routes.program, label: "Программа", icon: `${basePath}/nav/program.png` },
  { href: routes.together, label: "Вместе", icon: `${basePath}/nav/together.png` },
  { href: routes.library, label: "Библиотека", icon: `${basePath}/nav/library.png` },
  { href: routes.profile, label: "Профиль", icon: `${basePath}/nav/profile.png` },
];

/** Нижнее меню: плавающая панель, положение – docs/design-guide.md, раздел «Расположение». */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Главное меню"
      className="fixed bottom-[max(var(--nav-bottom),calc(var(--safe-bottom)-12px))] left-1/2 z-40 h-(--nav-height) w-[calc(min(100vw,440px)-2*var(--nav-side))] -translate-x-1/2 rounded-3xl border border-white/60 bg-background/72 shadow-[0_4px_20px_rgb(41_44_40/0.08)] backdrop-blur-[6px]"
    >
      <ul className="grid h-full grid-cols-4">
        {tabs.map((tab) => {
          const active =
            tab.href === routes.profile
              ? pathname === routes.profile ||
                pathname.startsWith(`${routes.profile}/`) ||
                pathname.startsWith(`${routes.person}/`)
              : pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 type-caption text-muted-foreground transition-colors",
                  active && "text-primary",
                )}
              >
                <span className="relative size-6">
                  <img src={tab.icon} alt="" className={cn("size-6", active && "invisible")} />
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-0 bg-current"
                      style={{
                        maskImage: `url("${tab.icon}")`,
                        WebkitMaskImage: `url("${tab.icon}")`,
                        maskRepeat: "no-repeat",
                        WebkitMaskRepeat: "no-repeat",
                        maskPosition: "center",
                        WebkitMaskPosition: "center",
                        maskSize: "contain",
                        WebkitMaskSize: "contain",
                      }}
                    />
                  )}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
