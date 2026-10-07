"use client";

import { useState, type FormEvent } from "react";
import { Plus, Upload } from "lucide-react";

import { getElements, type ElementId } from "@/entities/element";
import {
  libraryActions,
  libraryKindLabels,
  type LibraryItem,
  type LibraryItemKind,
} from "@/entities/library";
import { createId } from "@/shared/lib/create-local-store";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NativeSelect } from "@/shared/ui/native-select";

const kinds = Object.keys(libraryKindLabels) as LibraryItemKind[];

export function AddMaterialForm({ onAdded }: { onAdded?: (item: LibraryItem) => void }) {
  const [kind, setKind] = useState<LibraryItemKind>("video");
  const [title, setTitle] = useState("");
  const [elementId, setElementId] = useState<ElementId | "">("water");
  const [duration, setDuration] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);

  const hasFile = kind === "video" || kind === "meditation";

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const item: LibraryItem = {
      id: createId(kind),
      kind,
      title: title.trim(),
      elementId: elementId || undefined,
      duration: hasFile && duration.trim() ? duration.trim() : undefined,
      author: kind === "book" && author.trim() ? author.trim() : undefined,
      year: kind === "film" && year ? Number(year) : undefined,
      fileName: hasFile && fileName ? fileName : undefined,
    };
    libraryActions.add(item);
    onAdded?.(item);
    setTitle("");
    setDuration("");
    setAuthor("");
    setYear("");
    setFileName("");
    setFileInputKey((k) => k + 1);
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-background p-5">
      <h2 className="font-semibold">Добавить материал</h2>

      <div className="grid gap-2">
        <Label htmlFor="m-kind">Тип</Label>
        <NativeSelect id="m-kind" value={kind} onChange={(e) => setKind(e.target.value as LibraryItemKind)}>
          {kinds.map((k) => (
            <option key={k} value={k}>
              {libraryKindLabels[k]}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="m-title">Название</Label>
        <Input
          id="m-title"
          className="h-9"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={kind === "book" ? "Например: Дао дэ цзин" : "Например: Урок 3. Сон и восстановление"}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="m-element">Стихия</Label>
        <NativeSelect
          id="m-element"
          value={elementId}
          onChange={(e) => setElementId(e.target.value as ElementId | "")}
        >
          <option value="">Без стихии</option>
          {getElements().map((el) => (
            <option key={el.id} value={el.id}>
              {el.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      {hasFile && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="m-duration">Длительность</Label>
            <Input
              id="m-duration"
              className="h-9"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="15 мин"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="m-file">Файл с компьютера</Label>
            <label
              htmlFor="m-file"
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-input px-3 py-3 text-sm text-muted-foreground hover:border-primary/50"
            >
              <Upload className="size-4 shrink-0" />
              <span className="truncate">{fileName || "Выбрать видео или аудио"}</span>
            </label>
            <input
              key={fileInputKey}
              id="m-file"
              type="file"
              accept="video/*,audio/*"
              className="sr-only"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            />
            <p className="text-xs text-muted-foreground">
              В демо сохраняется только имя файла, сам файл никуда не отправляется.
            </p>
          </div>
        </>
      )}

      {kind === "book" && (
        <div className="grid gap-2">
          <Label htmlFor="m-author">Автор</Label>
          <Input id="m-author" className="h-9" value={author} onChange={(e) => setAuthor(e.target.value)} />
        </div>
      )}

      {kind === "film" && (
        <div className="grid gap-2">
          <Label htmlFor="m-year">Год</Label>
          <Input
            id="m-year"
            className="h-9"
            type="number"
            min={1900}
            max={2100}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>
      )}

      <Button type="submit" className="h-9 w-full" disabled={!title.trim()}>
        <Plus />
        Добавить
      </Button>
    </form>
  );
}
