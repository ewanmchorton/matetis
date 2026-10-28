"use client";

import { useCallback, useEffect, useState } from "react";

import { ElementBadge, getElement, type ElementId } from "@/entities/element";
import { request } from "@/shared/api/request";
import { isStaticPrototype } from "@/shared/config/env";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type Background = { kind: "element"; elementId: ElementId } | { kind: "transition"; from: ElementId; to: ElementId };
type CalendarState = { elementId: ElementId; background: Background; metalYear: number; metalStartsOn: string | null };

function backgroundLabel(background: Background) {
  if (background.kind === "element") return `стихии ${getElement(background.elementId).genitive}`;
  return `перехода ${getElement(background.from).name} → ${getElement(background.to).name}`;
}

/**
 * Текущая стихия в админке и день перехода с Земли на Металл.
 * Остальные стихии идут по временам года сами; день Металла каждый год разный — его говорит Жанна.
 */
export function CurrentElementCard() {
  const [state, setState] = useState<CalendarState | null>(null);
  const [day, setDay] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const apply = useCallback((next: CalendarState) => {
    setState(next);
    setDay(next.metalStartsOn ?? "");
  }, []);

  useEffect(() => {
    if (isStaticPrototype) return;
    request<CalendarState>("/api/admin/element")
      .then(apply)
      .catch((loadError: Error) => setError(loadError.message));
  }, [apply]);

  async function save(startsOn: string | null) {
    setPending(true);
    setError(null);
    try {
      apply(await request<CalendarState>("/api/admin/element", { method: "POST", body: JSON.stringify({ startsOn }) }));
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border bg-background p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">Текущая стихия</span>
        {state && <ElementBadge element={getElement(state.elementId)} className="text-sm" />}
        {state && <span className="text-sm text-muted-foreground">фон {backgroundLabel(state.background)}</span>}
      </div>

      {state && (
        <div className="space-y-2">
          <label htmlFor="metal-day" className="block text-sm font-medium">
            Металл осенью {state.metalYear} года начинается с
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              id="metal-day"
              type="date"
              className="h-11 w-auto"
              min={`${state.metalYear}-09-02`}
              max={`${state.metalYear}-11-30`}
              value={day}
              onChange={(event) => setDay(event.target.value)}
            />
            <Button className="h-11" disabled={pending || !day || day === state.metalStartsOn} onClick={() => void save(day)}>
              Сохранить
            </Button>
            {state.metalStartsOn && (
              <Button variant="ghost" className="h-11" disabled={pending} onClick={() => void save(null)}>
                Убрать дату
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Остальные стихии меняются сами по временам года. За 5 дней до смены стихии и 5 дней после — фон перехода.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
