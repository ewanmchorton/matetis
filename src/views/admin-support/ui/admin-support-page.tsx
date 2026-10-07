"use client";

import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";

import { ElementBadge, getElement, getElements, type ElementId } from "@/entities/element";
import { practiceActions, usePracticeCatalog } from "@/entities/practice";
import { createId } from "@/shared/lib/create-local-store";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NativeSelect } from "@/shared/ui/native-select";

export function AdminSupportPage() {
  const { support } = usePracticeCatalog();
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("10 минут");
  const [note, setNote] = useState("");
  const [elementId, setElementId] = useState<ElementId>("wood");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    practiceActions.addSupport({
      id: createId("support"),
      elementId,
      title: title.trim(),
      duration: duration.trim() || "10 минут",
      note: note.trim(),
    });
    setTitle("");
    setNote("");
  }

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Дополнительные практики</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Набор для каждой из пяти стихий. Человеку показываются практики той стихии, которой по
          дате рождения нужно внимание. Они не заменяют сезонную программу. Если дата не указана,
          блок не показывается.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {getElements().map((element) => {
          const items = support.filter((item) => item.elementId === element.id);
          return (
            <section key={element.id} className="space-y-3 rounded-2xl border bg-background p-4">
              <ElementBadge element={getElement(element.id)} />
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Пока пусто.</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.duration}
                          {item.note ? ` · ${item.note}` : ""}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Удалить «${item.title}»`}
                        onClick={() => practiceActions.removeSupport(item.id)}
                      >
                        <Trash2 className="text-muted-foreground" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-background p-5">
        <h2 className="font-semibold">Добавить в набор</h2>
        <div className="grid gap-4 sm:grid-cols-[1fr_140px_160px]">
          <div className="grid gap-2">
            <Label htmlFor="s-title">Название</Label>
            <Input id="s-title" className="h-9" value={title} onChange={(event) => setTitle(event.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-duration">Длительность</Label>
            <Input id="s-duration" className="h-9" value={duration} onChange={(event) => setDuration(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-element">Стихия</Label>
            <NativeSelect id="s-element" value={elementId} onChange={(event) => setElementId(event.target.value as ElementId)}>
              {getElements().map((element) => (
                <option key={element.id} value={element.id}>
                  {element.name}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="s-note">Короткая подсказка</Label>
          <Input id="s-note" className="h-9" value={note} onChange={(event) => setNote(event.target.value)} />
        </div>
        <Button type="submit" className="h-9" disabled={!title.trim()}>
          <Plus />
          Добавить
        </Button>
      </form>
    </>
  );
}
