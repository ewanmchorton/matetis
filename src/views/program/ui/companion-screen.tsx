"use client";

import { createPortal } from "react-dom";

import {
  CompanionImage,
  newPeriodText,
  transitionBackground,
  transitionText,
  type CompanionScreen as Screen,
} from "@/entities/companion";
import { getElement } from "@/entities/element";
import { typograph } from "@/shared/lib/typograph";
import { Button } from "@/shared/ui/button";
import { ScreenLayout } from "@/widgets/screen-layout";

/**
 * Экран спутника поверх программы: превращение в новое состояние или начало новой стихии.
 * Анимация: прежний вид → вспышка свечения → новый вид, потом текст и «Дальше».
 */
export function CompanionScreen({ screen, onNext }: { screen: Screen; onNext: () => void }) {
  const transition = screen.kind === "transition" ? screen : null;
  const text =
    screen.kind === "transition"
      ? transitionText(screen.to)
      : { ...newPeriodText, caption: `Стихия ${getElement(screen.elementId).name}` };

  // Поверх всего экрана, включая нижнее меню: каркас экрана – отдельный слой, из него окно не выйдет.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={text.title} className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-[440px]">
        <ScreenLayout
          variant="hero"
          fullImage
          centered
          haze={Boolean(transition)}
          background={transition ? transitionBackground(transition.to) : "07_new_period"}
          beforeTitle={
            <div className="flex flex-col items-center gap-4">
              <div className="companion-float relative aspect-square w-[min(88%,340px)]">
                {transition && (
                  <div aria-hidden className="companion-old absolute inset-0">
                    <CompanionImage stage={transition.from} className="size-full" />
                  </div>
                )}
                <CompanionImage stage={transition ? transition.to : 1} className="companion-new relative size-full" />
                <div
                  aria-hidden
                  className="companion-glow pointer-events-none absolute inset-[8%] rounded-full mix-blend-screen"
                  style={{
                    background:
                      "radial-gradient(circle, rgb(255 251 240 / 0.95) 0%, rgb(255 238 205 / 0.6) 35%, rgb(250 247 242 / 0) 70%)",
                  }}
                />
              </div>
              <p
                className={
                  transition
                    ? "companion-reveal type-caption tracking-[0.12em] text-muted-foreground uppercase"
                    : "companion-reveal type-secondary text-primary"
                }
              >
                {text.caption}
              </p>
            </div>
          }
          title={<span className="companion-reveal block text-balance">{typograph(text.title)}</span>}
          subtitle={<span className="companion-reveal block text-balance">{typograph(text.text)}</span>}
          actions={
            <Button size="cta" className="companion-reveal w-full" onClick={onNext}>
              Дальше
            </Button>
          }
        />
      </div>
    </div>,
    document.body,
  );
}
