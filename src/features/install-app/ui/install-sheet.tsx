"use client";

import type { ReactNode } from "react";
import { Ellipsis, Menu, Share, SquarePlus } from "lucide-react";

import { APP_NAME } from "@/shared/config/brand";
import { typograph } from "@/shared/lib/typograph";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/ui/sheet";

import type { Device } from "../model/device";
import { useInstallPrompt } from "../model/install-prompt";

const installSteps = {
  iphone: [
    { icon: Share, text: "Нажмите ⋯ справа внизу, затем «Поделиться»" },
    { icon: SquarePlus, text: "Пролистайте вниз и выберите «Добавить на экран „Домой“»" },
  ],
  inApp: [
    { icon: Ellipsis, text: "Нажмите меню ⋯ и выберите «Открыть в браузере»" },
    { icon: SquarePlus, text: "В браузере добавьте МАТЭТИС на экран «Домой»" },
  ],
  other: [
    { icon: Menu, text: "Откройте меню браузера" },
    { icon: SquarePlus, text: "Выберите «Установить приложение» или «Добавить на главный экран»" },
  ],
};

/** «⋯» в тексте шага — заметным кружком, как кнопка меню в Safari. */
function withMenuButton(text: string): ReactNode {
  const [before, after] = text.split("⋯");
  if (after === undefined) return text;
  return (
    <>
      {before}
      <span className="mx-0.5 inline-grid size-7 place-items-center rounded-full bg-background align-middle text-foreground shadow-[0_1px_4px_rgb(41_44_40/0.12)]">
        <Ellipsis className="size-5" strokeWidth={3} aria-label="Меню" />
      </span>
      {after}
    </>
  );
}

/**
 * Нижнее окно с шагами установки на «Домой».
 * reminder — напоминание: короткая причина сверху и кнопка «Не сейчас»; на Android, если браузер
 * даёт системное окно установки, вместо шагов — кнопка «Установить приложение».
 */
export function InstallSheet({
  device,
  open,
  onOpenChange,
  reminder = false,
}: {
  device: Device;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminder?: boolean;
}) {
  const install = useInstallPrompt();
  const steps = device === "iphone" ? installSteps.iphone : device === "inApp" ? installSteps.inApp : installSteps.other;
  const oneTap = reminder && install.canPrompt;

  async function onInstall() {
    await install.prompt();
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl bg-background px-(--screen-gutter) pt-6 pb-[calc(var(--safe-bottom)+24px)]"
      >
        <SheetHeader className="p-0">
          <SheetTitle className="type-section!">{reminder ? "Установите приложение" : "Установка приложения"}</SheetTitle>
        </SheetHeader>
        {oneTap ? (
          <Button size="cta" onClick={() => void onInstall()}>
            Установить приложение
          </Button>
        ) : (
          <ol className="space-y-3">
            {steps.map((step) => (
              <li key={step.text} className="flex items-center gap-4 rounded-2xl bg-secondary/55 p-4">
                <step.icon className="size-6 shrink-0 text-primary" />
                <span className="type-body">{withMenuButton(typograph(step.text))}</span>
              </li>
            ))}
          </ol>
        )}
        <SheetDescription className="type-secondary!">
          {typograph(
            `После установки откройте ${APP_NAME} с иконки на главном экране и войдите. Приложение будет открываться в одно касание, и можно будет настроить уведомления, чтобы не пропускать практики.`,
          )}
        </SheetDescription>
        {reminder && (
          <Button variant="ghost" size="cta" className="text-muted-foreground" onClick={() => onOpenChange(false)}>
            Не сейчас
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
}

