import { Play } from "lucide-react";

import { GlassCard } from "@/shared/ui/glass-card";

/** 300 → «5:00». */
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * Плеер аудиозаписи практики. Загрузки аудио в админке ещё нет, поэтому пока он только
 * показывает запись: кнопка неактивна, длительность — заглушка до настоящего файла.
 */
export function AudioPlayer({ durationSeconds }: { durationSeconds: number }) {
  return (
    <GlassCard className="flex items-center gap-4 bg-background/80 px-5 py-4">
      <button
        type="button"
        disabled
        aria-label="Слушать запись"
        className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
      >
        <Play aria-hidden className="size-5 translate-x-px fill-current" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="type-block text-foreground">Аудиозапись</p>
        <div className="mt-2 h-1 rounded-full bg-primary/15" />
        <div className="mt-1.5 flex justify-between type-caption text-muted-foreground">
          <span>0:00</span>
          <span>{clock(durationSeconds)}</span>
        </div>
      </div>
    </GlassCard>
  );
}
