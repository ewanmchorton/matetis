"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getElement } from "@/entities/element";
import { loadMyProgram } from "@/entities/program";
import type { MyProgram } from "@/entities/program/server";
import { request } from "@/shared/api/request";
import { routes } from "@/shared/config/routes";
import { typograph } from "@/shared/lib/typograph";
import { youTubeEmbedUrl } from "@/shared/lib/youtube";
import { BackButton } from "@/shared/ui/back-button";
import { Button } from "@/shared/ui/button";
import { GlassCard } from "@/shared/ui/glass-card";
import { ScreenLayout } from "@/widgets/screen-layout";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; program: MyProgram };

/** Карточка видео по стихии: видео смотрят здесь, «Просмотрено» убирает его из «На этой неделе». */
export function ElementVideoPage() {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "loading" });
  const [pending, setPending] = useState(false);

  useEffect(() => {
    loadMyProgram()
      .then((program) => setState({ status: "ready", program }))
      .catch((loadError: Error) => setState({ status: "error", message: loadError.message }));
  }, []);

  const program = state.status === "ready" ? state.program : null;
  const video = program?.elementVideo ?? null;
  const embed = video && youTubeEmbedUrl(video.videoUrl);

  async function markSeen() {
    setPending(true);
    try {
      await request("/api/program/element-video", { method: "POST" });
      router.push(routes.program);
    } catch (seenError) {
      setState({ status: "error", message: (seenError as Error).message });
      setPending(false);
    }
  }

  return (
    <ScreenLayout
      variant="page"
      background="04_earth_03_lizard"
      title={program ? `Видео по стихии ${getElement(program.season.elementId).genitive}` : "Видео по стихии"}
      actions={
        <>
          <BackButton onClick={() => router.push(routes.program)} />
          {video && !video.seen && (
            <Button size="cta" className="flex-1" disabled={pending} onClick={() => void markSeen()}>
              Просмотрено
            </Button>
          )}
        </>
      }
    >
      {state.status === "loading" && <GlassCard aria-hidden className="h-56 animate-pulse" />}
      {state.status === "error" && (
        <GlassCard>
          <p role="alert" className="type-secondary text-destructive">
            {typograph(state.message)}
          </p>
        </GlassCard>
      )}
      {state.status === "ready" && !video && (
        <GlassCard>
          <p className="type-body text-muted-foreground">{typograph("Видео по стихии пока не добавлено.")}</p>
        </GlassCard>
      )}
      {video && (
        <>
          {embed ? (
            <iframe
              src={embed}
              title="Видео по стихии"
              className="aspect-video w-full rounded-3xl bg-foreground"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <GlassCard>
              <a href={video.videoUrl} target="_blank" rel="noreferrer" className="type-body text-primary underline">
                Открыть видео
              </a>
            </GlassCard>
          )}
          {video.body && (
            <GlassCard className="bg-background/80">
              <p className="type-body text-foreground">{typograph(video.body)}</p>
            </GlassCard>
          )}
        </>
      )}
    </ScreenLayout>
  );
}
