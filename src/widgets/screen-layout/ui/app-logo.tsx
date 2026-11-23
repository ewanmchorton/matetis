"use client";

import { usePathname } from "next/navigation";

import { routes } from "@/shared/config/routes";
import { Logo } from "@/shared/ui/logo";

/** Экраны до программы: вход, онбординг и тест. На них логотип – просто надпись. */
const beforeProgram = [routes.auth, routes.onboarding, routes.typeTest];

function isBeforeProgram(pathname: string) {
  const path = pathname.replace(/\/$/, "") || "/";
  return beforeProgram.some((item) => path === item || path.startsWith(`${item}/`));
}

/** Логотип. В программе ведёт на экран программы. До теста не нажимается. */
export function AppLogo({ className }: { className?: string }) {
  const pathname = usePathname();
  return <Logo href={isBeforeProgram(pathname) ? undefined : routes.program} className={className} />;
}
