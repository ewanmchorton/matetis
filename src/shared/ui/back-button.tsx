import { Button } from "@/shared/ui/button";

/** Кнопка «Назад» слева от основной кнопки в пошаговых экранах. С первого шага её нет. */
export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="cta" className="w-auto border-white/60 bg-background/80" onClick={onClick}>
      Назад
    </Button>
  );
}
