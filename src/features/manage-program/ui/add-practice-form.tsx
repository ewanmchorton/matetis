"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";

import { getElements, type ElementId } from "@/entities/element";
import { practiceActions } from "@/entities/practice";
import { createId } from "@/shared/lib/create-local-store";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NativeSelect } from "@/shared/ui/native-select";
import { Textarea } from "@/shared/ui/textarea";

export function AddPracticeForm() {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("10 минут");
  const [why, setWhy] = useState("");
  const [steps, setSteps] = useState("");
  const [elementId, setElementId] = useState<ElementId>("water");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    practiceActions.addPractice({
      id: createId("practice"),
      elementId,
      title: title.trim(),
      duration: duration.trim() || "10 минут",
      why: why.trim(),
      steps: steps
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      allowTogether: true,
    });
    setTitle("");
    setWhy("");
    setSteps("");
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-background p-5">
      <h3 className="font-semibold">Новая практика дня</h3>
      <div className="grid gap-4 sm:grid-cols-[1fr_140px_160px]">
        <div className="grid gap-2">
          <Label htmlFor="p-title">Название</Label>
          <Input id="p-title" className="h-9" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="p-duration">Длительность</Label>
          <Input id="p-duration" className="h-9" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="p-element">Стихия</Label>
          <NativeSelect id="p-element" value={elementId} onChange={(e) => setElementId(e.target.value as ElementId)}>
            {getElements().map((el) => (
              <option key={el.id} value={el.id}>
                {el.name}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="p-why">Зачем эта практика</Label>
        <Textarea id="p-why" rows={2} value={why} onChange={(e) => setWhy(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="p-steps">Шаги — каждый с новой строки</Label>
        <Textarea
          id="p-steps"
          rows={3}
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          placeholder={"Сядьте удобно\nЗакройте глаза\n…"}
        />
      </div>
      <Button type="submit" className="h-9" disabled={!title.trim()}>
        <Plus />
        Добавить практику
      </Button>
    </form>
  );
}
