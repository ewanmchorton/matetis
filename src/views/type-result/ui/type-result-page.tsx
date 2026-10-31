"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { hasAccessNow, useMyAccess } from "@/entities/access";
import { getCurrentElement } from "@/entities/element";
import { getPersonType, getPersonTypes, type PersonType } from "@/entities/person-type";
import { useProgress } from "@/entities/progress";
import { ContactAdminButtons, ContactAdminText } from "@/features/contact-admin";
import { request, type RequestError } from "@/shared/api/request";
import { isDevelopment, isStaticPrototype } from "@/shared/config/env";
import { routes } from "@/shared/config/routes";
import { useIsClient } from "@/shared/lib/use-is-client";
import { buttonVariants } from "@/shared/ui/button";
import { GlassCard } from "@/shared/ui/glass-card";
import { ScreenLayout } from "@/widgets/screen-layout";

type ResultState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; type: PersonType };

/** Тип с сервера. Без сервера и при разработке без входа — из браузера. */
function useMyType(): ResultState {
  const router = useRouter();
  const isClient = useIsClient();
  const { typeId } = useProgress();
  // Из меню экранов (?demo=request) результат показывается и без пройденного теста — на примере первого типа.
  const isDemo = isClient && new URLSearchParams(window.location.search).has("demo");
  const localType = typeId ? getPersonType(typeId) : isDemo ? getPersonTypes()[0] : undefined;
  const [state, setState] = useState<ResultState | { status: "local" }>({ status: "loading" });

  useEffect(() => {
    if (isStaticPrototype) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ status: "local" });
      return;
    }
    request<{ type: PersonType | null }>("/api/type-test")
      .then(({ type }) => (type ? setState({ status: "ready", type }) : router.replace(routes.typeTest)))
      .catch((error: RequestError) => {
        if (error.status === 401 && isDevelopment) return setState({ status: "local" });
        if (error.status === 401) return router.replace(routes.auth);
        setState({ status: "error", message: error.message });
      });
  }, [router]);

  const missingLocalType = state.status === "local" && isClient && !localType;
  useEffect(() => {
    if (missingLocalType) router.replace(routes.typeTest);
  }, [missingLocalType, router]);

  if (state.status !== "local") return state;
  return isClient && localType ? { status: "ready", type: localType } : { status: "loading" };
}

export function TypeResultPage() {
  const state = useMyType();
  const accessState = useMyAccess();
  const element = getCurrentElement();
  const access = accessState.status === "ready" ? accessState.access : null;
  // Без доступа вместо кнопки — контакт администратора в карточке программы.
  const withAccess = access ? hasAccessNow(access.status) : null;

  return (
    <ScreenLayout
      variant="page"
      background="03_result"
      title={<span className="sr-only">Результат теста</span>}
      actions={
        withAccess ? (
          <Link href={routes.program} className={buttonVariants({ size: "cta" })}>
            Перейти к программе
          </Link>
        ) : undefined
      }
    >
      {state.status === "error" && (
        <GlassCard>
          <p role="alert" className="type-secondary text-destructive">
            {state.message}
          </p>
        </GlassCard>
      )}
      {state.status === "loading" && <GlassCard aria-hidden className="h-64 animate-pulse" />}
      {state.status === "ready" && (
        <>
          <GlassCard aria-label="Ваш психотип" className="space-y-3">
            <p className="type-secondary text-primary">Ваш психотип</p>
            <p className="type-title text-foreground">{state.type.name}</p>
            <ul className="flex flex-wrap gap-2">
              {state.type.traits.map((trait) => (
                <li key={trait} className="rounded-full bg-secondary/70 px-3.5 py-1.5 type-secondary text-foreground">
                  {trait}
                </li>
              ))}
            </ul>
          </GlassCard>
          <GlassCard aria-labelledby="program-ready-title" className="space-y-2">
            <h2 id="program-ready-title" className="type-section text-foreground">
              Ваша программа готова
            </h2>
            <p className="type-secondary text-muted-foreground">
              Мы подобрали практики для типа «{state.type.name}» на стихию {element.genitive}.{" "}
              {access && !withAccess ? (
                <ContactAdminText access={access} purpose="get" />
              ) : (
                "Когда стихия сменится, программа обновится сама."
              )}
            </p>
            {access && !withAccess && (
              <div className="pt-2">
                <ContactAdminButtons access={access} purpose="get" />
              </div>
            )}
          </GlassCard>
        </>
      )}
    </ScreenLayout>
  );
}
