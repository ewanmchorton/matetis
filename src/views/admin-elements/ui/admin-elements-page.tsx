"use client";

import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ElementBadge, getElement, type ElementId } from "@/entities/element";
import { request } from "@/shared/api/request";
import { isStaticPrototype } from "@/shared/config/env";
import { previewCalendar, previewElementPictures } from "@/shared/demo/admin-preview";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type Picture = { id: string; url: string; position: number };
type Pictures = { elementId: ElementId; main: Picture | null; practice: Picture[] };
type Calendar = {
  elementId: ElementId;
  metalYear: number;
  metalStartsOn: string | null;
};

const order: ElementId[] = ["wood", "fire", "earth", "metal", "water"];

/** Раздел «Стихии»: текущая стихия, картинки и день начала Металла. */
export function AdminElementsPage() {
  const [calendar, setCalendar] = useState<Calendar | null>(isStaticPrototype ? previewCalendar : null);
  const [pictures, setPictures] = useState<Pictures[] | null>(isStaticPrototype ? previewElementPictures() : null);
  const [open, setOpen] = useState<ElementId | null>(isStaticPrototype ? "metal" : null);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (isStaticPrototype) return;
    Promise.all([request<Calendar>("/api/admin/element"), request<Pictures[]>("/api/admin/elements")])
      .then(([nextCalendar, nextPictures]) => {
        setCalendar(nextCalendar);
        setPictures(nextPictures);
        setOpen((current) => current ?? nextCalendar.elementId);
      })
      .catch((loadError: Error) => setError(loadError.message));
  }, []);

  useEffect(load, [load]);

  async function upload(elementId: ElementId, kind: "main" | "practice", file: File) {
    setError(null);
    const body = new FormData();
    body.set("elementId", elementId);
    body.set("kind", kind);
    body.set("file", file);
    try {
      const next = await request<Pictures>("/api/admin/elements", { method: "POST", body });
      setPictures((current) => current?.map((item) => (item.elementId === next.elementId ? next : item)) ?? [next]);
    } catch (uploadError) {
      setError((uploadError as Error).message);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Удалить картинку?")) return;
    try {
      await request("/api/admin/elements", { method: "DELETE", body: JSON.stringify({ id }) });
      load();
    } catch (removeError) {
      setError((removeError as Error).message);
    }
  }

  async function dropPractice(elementId: ElementId, targetId: string) {
    const group = pictures?.find((item) => item.elementId === elementId);
    if (!group || !dragId || dragId === targetId) return;
    const items = [...group.practice];
    const from = items.findIndex((item) => item.id === dragId);
    const to = items.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    setDragId(null);
    try {
      const next = await request<Pictures>("/api/admin/elements", {
        method: "PUT",
        body: JSON.stringify({ elementId, ids: items.map((item) => item.id) }),
      });
      setPictures((current) => current?.map((item) => (item.elementId === next.elementId ? next : item)) ?? [next]);
    } catch (dropError) {
      setError((dropError as Error).message);
    }
  }

  async function saveMetal(startsOn: string) {
    setError(null);
    try {
      setCalendar(await request<Calendar>("/api/admin/element", { method: "POST", body: JSON.stringify({ startsOn: startsOn || null }) }));
    } catch (saveError) {
      setError((saveError as Error).message);
    }
  }

  if (!calendar || !pictures) {
    return error ? (
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    ) : (
      <p className="text-sm text-muted-foreground">Загружаем…</p>
    );
  }

  const current = getElement(calendar.elementId);
  const sorted = [calendar.elementId, ...order.filter((id) => id !== calendar.elementId)];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Стихии</h1>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <section className="flex flex-wrap items-center gap-3 rounded-2xl border bg-background p-5">
        <span className="text-sm text-muted-foreground">Сейчас</span>
        <ElementBadge element={current} className="text-sm" />
        <span className="text-sm text-muted-foreground">{current.season}</span>
      </section>

      {sorted.map((elementId) => {
        const element = getElement(elementId);
        const group = pictures.find((item) => item.elementId === elementId);
        const shown = open === elementId;
        return (
          <section key={elementId} className="overflow-hidden rounded-2xl border bg-background">
            <button type="button" className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpen(shown ? null : elementId)}>
              <span className="flex-1 font-semibold">
                {element.name}
                {elementId === calendar.elementId ? " · сейчас" : ""}
              </span>
              <span className="text-xs text-muted-foreground">
                {group?.main ? "основная есть" : "основной нет"}
                {group?.practice.length ? ` · экранов практик ${group.practice.length}` : ""}
              </span>
            </button>
            {shown && group && (
              <div className="space-y-5 border-t p-4">
                {elementId === "metal" && (
                  <MetalDate year={calendar.metalYear} value={calendar.metalStartsOn} onSave={(day) => void saveMetal(day)} />
                )}
                <div className="space-y-2">
                  <h2 className="font-medium">Основная картинка</h2>
                  <div className="flex flex-wrap items-end gap-3">
                    {group.main && <Thumb picture={group.main} onRemove={() => void remove(group.main!.id)} />}
                    <FileButton label={group.main ? "Заменить" : "Выбрать картинку"} onFile={(file) => void upload(elementId, "main", file)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="font-medium">Экраны практик</h2>
                  <div className="flex flex-wrap gap-3">
                    {group.practice.map((picture) => (
                      <div
                        key={picture.id}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => void dropPractice(elementId, picture.id)}
                      >
                        <span
                          draggable
                          className="mb-1 block cursor-grab text-center text-muted-foreground"
                          onDragStart={() => setDragId(picture.id)}
                        >
                          ⋮⋮
                        </span>
                        <Thumb picture={picture} onRemove={() => void remove(picture.id)} />
                      </div>
                    ))}
                  </div>
                  <FileButton label="Добавить картинку" onFile={(file) => void upload(elementId, "practice", file)} />
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function MetalDate({ year, value, onSave }: { year: number; value: string | null; onSave: (day: string) => void }) {
  const [day, setDay] = useState(value ?? `${year}-11-01`);
  return (
    <div className="space-y-2">
      <label htmlFor="metal-day" className="block text-sm font-medium">
        Металл осенью {year} года начинается с
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <Input id="metal-day" type="date" className="h-11 w-auto" min={`${year}-09-02`} max={`${year}-11-30`} value={day} onChange={(event) => setDay(event.target.value)} />
        <Button className="h-11" disabled={!day || day === (value ?? `${year}-11-01`)} onClick={() => onSave(day)}>
          Сохранить
        </Button>
        {value && (
          <Button variant="ghost" className="h-11" onClick={() => onSave("")}>
            Вернуть 1 ноября
          </Button>
        )}
      </div>
    </div>
  );
}

function Thumb({ picture, onRemove }: { picture: Picture; onRemove: () => void }) {
  return (
    <div className="relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={picture.url} alt="" className="h-28 w-20 rounded-xl object-cover" />
      <Button variant="ghost" size="icon" className="absolute top-1 right-1 size-8 bg-background/80" aria-label="Удалить картинку" onClick={onRemove}>
        <Trash2 />
      </Button>
    </div>
  );
}

function FileButton({ label, onFile }: { label: string; onFile: (file: File) => void }) {
  return (
    <label className="inline-flex h-11 cursor-pointer items-center rounded-full border px-4 text-sm">
      {label}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
    </label>
  );
}
