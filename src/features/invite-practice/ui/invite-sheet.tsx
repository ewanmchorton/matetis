"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { CompanionAvatar, isCompanionStage, type CompanionStage } from "@/entities/companion";
import type { InviteOptions } from "@/entities/together/server";
import { typograph } from "@/shared/lib/typograph";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";

function stageOf(value: number): CompanionStage {
  return isCompanionStage(value) ? value : 1;
}

type Step = "friend" | "practice";

/**
 * Панель «Предложить практику»: снизу, сначала друг, потом практика.
 * Если друг уже выбран (из его профиля), сразу шаг с практикой.
 */
export function InviteSheet({
  open,
  friendId,
  onOpenChange,
  loadOptions,
  onInvite,
  pending,
  blocked,
}: {
  open: boolean;
  friendId?: string;
  onOpenChange: (open: boolean) => void;
  loadOptions: (friendId?: string) => Promise<InviteOptions>;
  onInvite: (friendId: string, practiceId: string) => Promise<unknown> | void;
  pending: boolean;
  /** Почему предложить нельзя: например, совместная практика уже идёт. */
  blocked?: string | null;
}) {
  const [step, setStep] = useState<Step>("friend");
  const [options, setOptions] = useState<InviteOptions | null>(null);
  const [friend, setFriend] = useState("");
  const [practice, setPractice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // Открытие заново: шаг и выбор сбрасываются здесь, а не при каждом рендере.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep(friendId ? "practice" : "friend");
    setFriend(friendId ?? "");
    setPractice("");
    setError(null);
    setOptions(null);
    setLoading(true);
    loadOptions(friendId)
      .then((data) => {
        if (!cancelled) setOptions(data);
      })
      .catch((loadError: Error) => {
        if (!cancelled) setError(loadError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, friendId, loadOptions]);

  const chosen = options?.friends.find((item) => item.id === friend);

  function close() {
    onOpenChange(false);
  }

  function onHandlePointerDown(event: React.PointerEvent) {
    const start = event.clientY;
    function move(next: PointerEvent) {
      if (next.clientY - start > 70) {
        close();
        end();
      }
    }
    function end() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
  }

  async function toPractices() {
    if (!friend) return;
    setStep("practice");
    setLoading(true);
    setError(null);
    try {
      const data = await loadOptions(friend);
      setOptions(data);
      if (data.practices.length === 1) setPractice(data.practices[0].id);
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function invite() {
    if (!friend || !practice) return;
    await onInvite(friend, practice);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto max-h-[85dvh] w-full max-w-[440px] gap-4 overflow-y-auto rounded-t-3xl bg-background px-6 pt-2 pb-[calc(var(--safe-bottom)+24px)]"
      >
        <button
          type="button"
          aria-label="Закрыть"
          className="flex h-8 w-full items-center justify-center"
          onPointerDown={onHandlePointerDown}
          onClick={close}
        >
          <span className="h-1 w-10 rounded-full bg-secondary" />
        </button>
        <div className="flex items-start justify-between gap-3">
          <SheetTitle className="type-section!">
            {blocked ? "Предложить практику" : step === "friend" ? "С кем практиковать?" : "Выберите практику"}
          </SheetTitle>
          <Button type="button" variant="ghost" size="icon" className="size-11 shrink-0" aria-label="Закрыть" onClick={close}>
            <X />
          </Button>
        </div>

        {blocked && <p className="type-secondary text-muted-foreground">{typograph(blocked)}</p>}

        {!blocked && step === "friend" && (
          <p className="type-secondary text-muted-foreground">{typograph("Выберите друга для совместной практики.")}</p>
        )}
        {!blocked && step === "practice" && (
          <div className="space-y-3">
            <button
              type="button"
              className="min-h-11 text-left type-secondary text-primary"
              onClick={() => setStep("friend")}
            >
              Назад к друзьям
            </button>
            <p className="type-secondary text-muted-foreground">
              {typograph("Практики, которые есть в программе у вас обоих.")}
            </p>
            {chosen && (
              <div className="flex items-center gap-3">
                <CompanionAvatar stage={stageOf(chosen.companionStage)} className="size-11" />
                <p className="type-block">{chosen.name}</p>
              </div>
            )}
          </div>
        )}

        {!blocked && error && (
          <p role="alert" className="type-secondary text-destructive">
            {typograph(error)}
          </p>
        )}
        {!blocked && loading && <p className="type-secondary text-muted-foreground">Загружаем…</p>}

        {!blocked && step === "friend" && options && (
          <div role="radiogroup" aria-label="Друзья" className="space-y-3">
            {options.friends.length === 0 && (
              <p className="type-secondary text-muted-foreground">Друзей пока нет.</p>
            )}
            {options.friends.map((item) => {
              const selected = friend === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={item.busy}
                  onClick={() => setFriend(item.id)}
                  className={cn(
                    "flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-2 text-left",
                    selected ? "border-primary/40 bg-primary/8" : "border-foreground/10 bg-background",
                    item.busy && "opacity-50",
                  )}
                >
                  <CompanionAvatar stage={stageOf(item.companionStage)} className="size-11" />
                  <span className="min-w-0 flex-1">
                    <span className="block type-block">{item.name}</span>
                    {item.busy && <span className="block type-caption text-muted-foreground">Уже практикует вместе</span>}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-6 place-items-center rounded-full border-2",
                      selected ? "border-primary" : "border-foreground/20",
                    )}
                  >
                    {selected && <span className="size-3 rounded-full bg-primary" />}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {!blocked && step === "practice" && options && !loading && (
          <div role="radiogroup" aria-label="Практики" className="space-y-3">
            {chosen?.busy && (
              <p className="type-secondary text-muted-foreground">
                {typograph(`${chosen.name} уже практикует вместе с кем-то. Выберите другого друга.`)}
              </p>
            )}
            {!chosen?.busy && options.practices.length === 0 && (
              <p className="type-secondary text-muted-foreground">
                {typograph("Сейчас нет практики, которая есть у вас обоих.")}
              </p>
            )}
            {options.practices.map((item) => {
              const selected = practice === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setPractice(item.id)}
                  className={cn(
                    "flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left",
                    selected ? "border-primary/40 bg-primary/8" : "border-foreground/10 bg-background",
                  )}
                >
                  <span className="min-w-0 flex-1 type-block">{typograph(item.title)}</span>
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full border-2",
                      selected ? "border-primary" : "border-foreground/20",
                    )}
                  >
                    {selected && <span className="size-3 rounded-full bg-primary" />}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {!blocked &&
          (step === "friend" ? (
            <Button size="cta" disabled={!friend || loading} onClick={() => void toPractices()}>
              Дальше
            </Button>
          ) : (
            <Button size="cta" disabled={!practice || pending || Boolean(chosen?.busy)} onClick={() => void invite()}>
              Пригласить
            </Button>
          ))}
      </SheetContent>
    </Sheet>
  );
}
