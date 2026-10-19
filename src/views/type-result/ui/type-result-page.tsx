"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentElement } from "@/entities/element";
import { getPersonType, type PersonType } from "@/entities/person-type";
import { useProgress } from "@/entities/progress";
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
  const localType = typeId ? getPersonType(typeId) : undefined;
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
  const element = getCurrentElement();

  return (
    <ScreenLayout
      variant="page"
      background="03_result"
      title={<span className="sr-only">Результат теста</span>}
      actions={
        <Link href={routes.program} className={buttonVariants({ size: "cta" })}>
          Перейти к программе
        </Link>
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
              Мы подобрали практики для типа «{state.type.name}» на стихию {element.name}. Когда стихия сменится,
              программа обновится сама.
            </p>
          </GlassCard>
        </>
      )}
    </ScreenLayout>
  );
}
