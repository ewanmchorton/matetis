"use client";

import { createPortal } from "react-dom";

import { typograph } from "@/shared/lib/typograph";
import { youTubeEmbedUrl } from "@/shared/lib/youtube";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";

/**
 * Приветственное видео поверх программы: открывается само, пока человек не нажал «Просмотрено».
 * Закрыл приложение, не досмотрев, — откроется снова при следующем входе.
 */
export function WelcomeVideo({ video, onSeen }: { video: { videoUrl: string; body: string }; onSeen: () => void }) {
  const embed = youTubeEmbedUrl(video.videoUrl);
  // Поверх всего экрана, включая нижнее меню: каркас экрана — отдельный слой, из него окно не выйдет.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-video-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-background"
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col gap-6 px-(--screen-gutter) pt-[calc(var(--safe-top)+var(--header-top))] pb-[calc(var(--safe-bottom)+var(--action-bottom))]">
        <div className="flex h-(--header-height) items-center">
          <Logo />
        </div>
        <h1 id="welcome-video-title" className="type-title text-foreground">
          Приветственное видео
        </h1>
        {embed ? (
          <iframe
            src={embed}
            title="Приветственное видео"
            className="aspect-video w-full rounded-3xl"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <a href={video.videoUrl} target="_blank" rel="noreferrer" className="type-body text-primary underline">
            Открыть видео
          </a>
        )}
        {video.body && <p className="type-body text-foreground">{typograph(video.body)}</p>}
        <Button size="cta" className="mt-auto" onClick={onSeen}>
          Просмотрено
        </Button>
      </div>
    </div>,
    document.body,
  );
}
