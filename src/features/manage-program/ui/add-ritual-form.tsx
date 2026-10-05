"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";

import { getElements, type ElementId } from "@/entities/element";
import { practiceActions, type WeeklyRitualSchedule } from "@/entities/practice";
import { createId } from "@/shared/lib/create-local-store";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NativeSelect } from "@/shared/ui/native-select";

export function AddRitualForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [schedule, setSchedule] = useState<WeeklyRitualSchedule>("once_per_week");
  const [elementId, setElementId] = useState<ElementId>("water");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    practiceActions.addRitual({
      id: createId("ritual"),
      elementId,
      title: title.trim(),
      description: description.trim(),
      schedule,
    });
    setTitle("");
    setDescription("");
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-background p-5">
      <h3 className="font-semibold">Новый ритуал</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="r-title">Название</Label>
          <Input id="r-title" className="h-9" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="r-description">Описание</Label>
          <Input
            id="r-description"
            className="h-9"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="r-schedule">Как часто</Label>
          <NativeSelect
            id="r-schedule"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value as WeeklyRitualSchedule)}
          >
            <option value="once_per_week">Раз в неделю</option>
            <option value="daily">Отметки по дням</option>
          </NativeSelect>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="r-element">Стихия</Label>
          <NativeSelect id="r-element" value={elementId} onChange={(e) => setElementId(e.target.value as ElementId)}>
            {getElements().map((el) => (
              <option key={el.id} value={el.id}>
                {el.name}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <Button type="submit" className="h-9" disabled={!title.trim()}>
        <Plus />
        Добавить ритуал
      </Button>
    </form>
  );
}
