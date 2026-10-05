import { ImageIcon, Play } from "lucide-react";

import { cn } from "@/shared/lib/utils";

export function VideoPlaceholder({
  title,
  duration,
  className,
}: {
  title: string;
  duration?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex aspect-video w-full items-end overflow-hidden rounded-xl bg-gradient-to-br from-stone-700 via-stone-800 to-stone-950 p-4 text-white",
        className,
      )}
    >
      <div className="absolute inset-0 grid place-items-center">
        <span className="grid size-14 place-items-center rounded-full bg-white/15 backdrop-blur">
          <Play className="size-6 fill-white" />
        </span>
      </div>
      <div className="relative">
        <p className="text-sm font-medium">{title}</p>
        {duration && <p className="text-xs text-white/70">Видео · {duration}</p>}
      </div>
    </div>
  );
}

export function ImagePlaceholder({
  label = "Иллюстрация",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-amber-50 to-stone-200 text-stone-500 dark:from-stone-800 dark:to-stone-900",
        className,
      )}
    >
      <ImageIcon className="size-8" />
      <span className="text-xs">{label}</span>
    </div>
  );
}
