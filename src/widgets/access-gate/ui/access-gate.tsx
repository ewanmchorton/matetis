"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useMyAccess } from "@/entities/access";
import { ContactAdminButtons, ContactAdminText } from "@/features/contact-admin";
import { routes } from "@/shared/config/routes";
import { GlassCard } from "@/shared/ui/glass-card";
import { ScreenLayout } from "@/widgets/screen-layout";

const tabTitles: [string, string][] = [
  [routes.program, "Программа"],
  [routes.together, "Вместе"],
  [routes.library, "Библиотека"],
  [routes.profile, "Профиль"],
  [routes.person, "Профиль"],
];

/**
 * Вкладки приложения — только с доступом. Доступ закончился — «Срок подписки истёк».
 * Доступ ещё не открывали — назад к результату теста (там контакт администратора),
 * а если тест не пройден — к тесту. Не вошёл — на вход.
 */
export function AccessGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const state = useMyAccess();
  const kind = state.status === "ready" ? state.access.status.kind : null;

  useEffect(() => {
    if (state.status === "signed-out") router.replace(routes.auth);
    if (kind === "request") router.replace(routes.typeResult);
    if (kind === "none") router.replace(routes.typeTest);
  }, [state.status, kind, router]);

  if (state.status !== "ready") return null;
  if (kind === "staff" || kind === "active") return children;
  if (kind !== "expired") return null;

  const title = tabTitles.find(([href]) => pathname.startsWith(href))?.[1] ?? "Программа";
  return (
    <ScreenLayout variant="page" background="03_result" title={title}>
      <GlassCard aria-labelledby="access-expired-title" className="space-y-2">
        <h2 id="access-expired-title" className="type-section text-foreground">
          Срок подписки истёк
        </h2>
        <p className="type-secondary text-muted-foreground">
          <ContactAdminText access={state.access} purpose="renew" />
        </p>
        <div className="pt-2">
          <ContactAdminButtons access={state.access} purpose="renew" />
        </div>
      </GlassCard>
    </ScreenLayout>
  );
}
