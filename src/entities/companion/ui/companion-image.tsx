import { cn } from "@/shared/lib/utils";

import type { CompanionStage } from "../model/stage";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Картинки из design/character, собранные scripts/build-character.sh. */
export const companionImageSrc = (stage: CompanionStage) => `${basePath}/character/stage-${stage}.png`;
const avatarSrc = (stage: CompanionStage) => `${basePath}/character/avatar-${stage}.png`;

/** Спутник в полный рост, квадратная картинка с прозрачным фоном. */
export function CompanionImage({ stage, className }: { stage: CompanionStage; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- картинка из public, размер задаёт место на экране
    <img
      src={companionImageSrc(stage)}
      alt="Спутник «Гармония»"
      width={800}
      height={800}
      className={cn("aspect-square object-contain", className)}
    />
  );
}

/** Спутник в кружке вместо аватарки. */
export function CompanionAvatar({ stage, className }: { stage: CompanionStage; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- картинка из public, размер задаёт место на экране
    <img
      src={avatarSrc(stage)}
      alt=""
      width={256}
      height={256}
      className={cn("size-14 rounded-full bg-secondary/80 object-cover", className)}
    />
  );
}
