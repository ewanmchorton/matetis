"use client";

import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { demoProgram } from "@/entities/program";
import type { NavigatorToday } from "@/entities/program/server";
import { request } from "@/shared/api/request";
import { isStaticPrototype } from "@/shared/config/env";
import { routes } from "@/shared/config/routes";
import { typograph } from "@/shared/lib/typograph";
import { BackButton } from "@/shared/ui/back-button";
import { Button } from "@/shared/ui/button";
import { GlassCard } from "@/shared/ui/glass-card";
import { ScreenLayout } from "@/widgets/screen-layout";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; navigator: NavigatorToday | null };

/** Источник посланий Мастеров. Один на все, в базе не хранится. */
const MASTERS_BOOK = "«Книга Мудрости» Т.Н. Микушина";
/** Источник посланий старцев — уточнится, когда будут примеры. */
const ELDERS_SOURCE = "Печорские старцы";

function Paragraphs({ text }: { text: string }) {
  return text
    .split(/\n\s*\n|\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => (
      <p key={index} className="type-body text-foreground">
        {typograph(paragraph)}
      </p>
    ));
}

const partTitleClass = "font-display text-[26px] leading-[1.2] font-medium text-foreground";

/** Экран навигатора дня: часть послания (или послание целиком, или старцы), источник, задание, «Прочитано». */
export function NavigatorPage() {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "loading" });
  const [sourceOpen, setSourceOpen] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (isStaticPrototype) {
      // На GitHub Pages сервера нет — показываем послание-пример.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ status: "ready", navigator: demoProgram().navigator });
      return;
    }
    request<NavigatorToday | null>("/api/program/navigator")
      .then((navigator) => setState({ status: "ready", navigator }))
      .catch((loadError: Error) => setState({ status: "error", message: loadError.message }));
  }, []);

  useEffect(() => {
    if (!sourceOpen) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setSourceOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [sourceOpen]);

  const navigator = state.status === "ready" ? state.navigator : null;

  async function markRead() {
    setPending(true);
    try {
      if (!isStaticPrototype) await request("/api/program/navigator", { method: "POST" });
      router.push(routes.program);
    } catch (readError) {
      setState({ status: "error", message: (readError as Error).message });
      setPending(false);
    }
  }

  const content = (
    <>
      {state.status === "loading" && <GlassCard aria-hidden className="h-96 animate-pulse" />}
      {state.status === "error" && (
        <GlassCard>
          <p role="alert" className="type-secondary text-destructive">
            {typograph(state.message)}
          </p>
        </GlassCard>
      )}
      {state.status === "ready" && !navigator && (
        <GlassCard>
          <p className="type-body text-muted-foreground">{typograph("Послание на сегодня пока не готово.")}</p>
        </GlassCard>
      )}

      {navigator && (
        <>
          <GlassCard className="flex flex-col gap-4 bg-background/80">
            {navigator.kind === "elders" && navigator.elders ? (
              <>
                <h2 className={partTitleClass}>{typograph(navigator.elders.title)}</h2>
                <Paragraphs text={navigator.elders.body} />
              </>
            ) : (
              navigator.parts.map((part, index) => (
                <div key={index} className="flex flex-col gap-4">
                  <h2 className={partTitleClass}>{typograph(part.title)}</h2>
                  <Paragraphs text={part.body} />
                </div>
              ))
            )}
            <button
              type="button"
              className="-my-3 min-h-11 self-start type-caption text-muted-foreground underline underline-offset-3"
              onClick={() => setSourceOpen(true)}
            >
              Источник
            </button>
          </GlassCard>

          {navigator.task && (
            <GlassCard className="space-y-2 border-primary/10 bg-[linear-gradient(rgb(53_88_70/0.08),rgb(53_88_70/0.08))] bg-background/80">
              <p className="type-caption text-primary">
                {navigator.newTask ? "Новое задание" : "Задание"} · день {navigator.cycleDay}
              </p>
              <p className="type-body text-foreground">{typograph(navigator.task)}</p>
            </GlassCard>
          )}

          {sourceOpen && (
            <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Источник">
              <button
                type="button"
                aria-label="Закрыть"
                className="absolute inset-0 bg-foreground/35"
                onClick={() => setSourceOpen(false)}
              />
              <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-[440px] flex-col gap-3 rounded-t-3xl bg-background px-6 pt-3 pb-[calc(var(--safe-bottom)+28px)] shadow-[0_-4px_24px_rgb(41_44_40/0.12)]">
                <span aria-hidden className="h-1 w-10 self-center rounded-full bg-foreground/20" />
                <button
                  type="button"
                  aria-label="Закрыть"
                  className="absolute top-2 right-3 grid size-11 place-items-center text-muted-foreground"
                  onClick={() => setSourceOpen(false)}
                >
                  <XIcon className="size-5" />
                </button>
                <p className="mt-2 type-secondary text-muted-foreground">
                  {navigator.kind === "elders" ? (
                    ELDERS_SOURCE
                  ) : (
                    <>
                      {MASTERS_BOOK}
                      <br />
                      {navigator.masterName}
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );

  const date = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

  return (
    <ScreenLayout
      variant="page"
      background="04_earth_02_navigator"
      beforeTitle={<p className="type-caption text-muted-foreground">{date}</p>}
      title="Навигатор дня"
      subtitle={navigator?.newTask ? "Прочитайте послание ещё раз и выполните новое задание" : undefined}
      actions={
        <>
          <BackButton onClick={() => router.push(routes.program)} />
          <Button size="cta" className="flex-1" disabled={pending || !navigator} onClick={() => void markRead()}>
            Прочитано
          </Button>
        </>
      }
      titleGlow
      afterHaze={content}
    />
  );
}
