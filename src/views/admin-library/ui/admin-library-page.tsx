"use client";

import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { getElement, getElements, type ElementId } from "@/entities/element";
import { formatLabel, type BookFormat } from "@/entities/library/model/readable-books";
import { request } from "@/shared/api/request";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

type Recommendation = { id: string; title: string; author: string | null; year: number | null };
type ElementPage = {
  id: ElementId;
  videoUrl: string | null;
  body: string;
  books: Recommendation[];
  films: Recommendation[];
};
type Practice = {
  id: string;
  title: string;
  kind: "video" | "audio";
  body: string;
  videoUrl: string | null;
  hasAudio: boolean;
};
type Book = { id: string; title: string; author: string; format: BookFormat; ready: boolean };
type Catalog = { elements: ElementPage[]; practices: Practice[]; books: Book[] };
const tabs = [
  { id: "elements", label: "Видео стихий" },
  { id: "practices", label: "Практики" },
  { id: "books", label: "Книги" },
] as const;

type Chapter = (typeof tabs)[number]["id"];

/** Раздел «Библиотека»: видео стихий, практики и книги. */
export function AdminLibraryPage() {
  const [chapter, setChapter] = useState<Chapter>("elements");
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elementId, setElementId] = useState<ElementId | null>("water");
  const [openPractice, setOpenPractice] = useState<string | null>(null);
  const [addingPractice, setAddingPractice] = useState(false);

  const load = useCallback(() => {
    request<Catalog>("/api/admin/library/sections")
      .then(setCatalog)
      .catch((loadError: Error) => setError(loadError.message));
  }, []);

  useEffect(load, [load]);

  async function run(task: () => Promise<Catalog>) {
    setError(null);
    try {
      setCatalog(await task());
      setAddingPractice(false);
      setOpenPractice(null);
    } catch (taskError) {
      setError((taskError as Error).message);
    }
  }

  if (!catalog) return <p className="text-sm text-muted-foreground">Загружаем…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Библиотека</h1>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Разделы библиотеки">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={chapter === item.id}
            onClick={() => setChapter(item.id)}
            className={cn(
              "min-h-11 rounded-full border px-4 text-sm",
              chapter === item.id ? "border-primary bg-primary/10 text-primary" : "bg-background text-muted-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {chapter === "elements" && (
              <div className="space-y-2">
                {getElements().map((element) => {
                  const page = catalog.elements.find((entry) => entry.id === element.id);
                  if (!page) return null;
                  const shown = elementId === element.id;
                  return (
                    <section key={element.id} className="overflow-hidden rounded-xl border">
                      <button type="button" className="flex min-h-12 w-full items-center gap-3 px-3 text-left" onClick={() => setElementId(shown ? null : element.id)}>
                        <span className="flex-1 font-medium">{element.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {page.videoUrl ? "видео есть" : "видео нет"}
                          {page.books.length ? ` · книг ${page.books.length}` : ""}
                          {page.films.length ? ` · фильмов ${page.films.length}` : ""}
                        </span>
                        <ChevronDown className={cn("size-4 text-muted-foreground", shown && "rotate-180")} />
                      </button>
                      {shown && <ElementEditor page={page} onSaved={(next) => setCatalog(next)} onError={setError} />}
                    </section>
                  );
                })}
              </div>
            )}
            {chapter === "practices" && (
              <div className="space-y-3">
                <div className="sticky top-0 z-10 bg-background py-1">
                  {addingPractice ? (
                    <PracticeForm
                      submitLabel="Добавить практику"
                      onSubmit={(event) =>
                        void run(async () => {
                          const data = new FormData(event.currentTarget);
                          const saved = await request<Catalog>("/api/admin/library/practices", {
                            method: "POST",
                            body: JSON.stringify(practicePayload(data)),
                          });
                          const file = data.get("audio");
                          const created = saved.practices.find((practice) => practice.title === String(data.get("title") ?? "").trim());
                          if (file instanceof File && file.size > 0 && created) await uploadAudio(created.id, file);
                          return request<Catalog>("/api/admin/library/sections");
                        })
                      }
                    />
                  ) : (
                    <Button variant="outline" className="h-11" onClick={() => setAddingPractice(true)}>
                      <Plus />
                      Добавить практику
                    </Button>
                  )}
                </div>
                {catalog.practices.map((practice) => (
                  <div key={practice.id} className="rounded-xl border p-3">
                    <div className="flex items-center gap-2">
                      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setOpenPractice(openPractice === practice.id ? null : practice.id)}>
                        <span className="block font-medium">{practice.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          {practice.kind === "video" ? "Видео" : "Аудио"}
                          {practice.kind === "audio" ? (practice.hasAudio ? " · файл есть" : " · файла ещё нет") : ""}
                        </span>
                      </button>
                      {practice.id !== "welcome" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-11"
                          aria-label={`Удалить «${practice.title}»`}
                          onClick={() => {
                            if (!window.confirm(`Удалить «${practice.title}»?`)) return;
                            void run(() => request<Catalog>("/api/admin/library/practices", { method: "DELETE", body: JSON.stringify({ id: practice.id }) }));
                          }}
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                    {openPractice === practice.id && (
                      <PracticeForm
                        practice={practice}
                        submitLabel="Сохранить"
                        onSubmit={(event) =>
                          void run(async () => {
                            const data = new FormData(event.currentTarget);
                            if (practice.id === "welcome") {
                              await request("/api/admin/library", {
                                method: "POST",
                                body: JSON.stringify({ slot: "welcome", videoUrl: String(data.get("video") ?? ""), body: String(data.get("body") ?? "") }),
                              });
                            } else {
                              await request("/api/admin/library/practices", {
                                method: "POST",
                                body: JSON.stringify({ id: practice.id, ...practicePayload(data) }),
                              });
                              const file = data.get("audio");
                              if (file instanceof File && file.size > 0) await uploadAudio(practice.id, file);
                            }
                            return request<Catalog>("/api/admin/library/sections");
                          })
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
      {chapter === "books" && (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-background">
          {catalog.books.map((book) => (
            <li key={book.id} className="px-4 py-3">
              <span className="block font-medium">{book.title}</span>
              <span className="block text-sm text-muted-foreground">
                {book.author} · {formatLabel[book.format]} · {book.ready ? "файл на месте" : "файла нет на компьютере"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function practicePayload(data: FormData) {
  const kind = data.get("kind") === "audio" ? "audio" : "video";
  return {
    title: String(data.get("title") ?? ""),
    body: String(data.get("body") ?? ""),
    kind,
    videoUrl: kind === "video" ? String(data.get("video") ?? "") : "",
  };
}

function uploadAudio(id: string, file: File) {
  const body = new FormData();
  body.set("id", id);
  body.set("file", file);
  return request("/api/admin/library/practices/audio", { method: "POST", body });
}

function ElementEditor({
  page,
  onSaved,
  onError,
}: {
  page: ElementPage;
  onSaved: (catalog: Catalog) => void;
  onError: (message: string | null) => void;
}) {
  const element = getElement(page.id);

  async function saveVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onError(null);
    try {
      await request("/api/admin/library", {
        method: "POST",
        body: JSON.stringify({ slot: page.id, videoUrl: String(data.get("video") ?? ""), body: String(data.get("body") ?? "") }),
      });
      onSaved(await request<Catalog>("/api/admin/library/sections"));
    } catch (saveError) {
      onError((saveError as Error).message);
    }
  }

  async function addItem(kind: "book" | "film", event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onError(null);
    try {
      const year = String(data.get("year") ?? "");
      onSaved(
        await request<Catalog>("/api/admin/library/recommendations", {
          method: "POST",
          body: JSON.stringify({
            elementId: page.id,
            kind,
            title: String(data.get("title") ?? ""),
            author: String(data.get("author") ?? ""),
            year: year ? Number(year) : null,
          }),
        }),
      );
      event.currentTarget.reset();
    } catch (saveError) {
      onError((saveError as Error).message);
    }
  }

  async function removeItem(id: string) {
    onError(null);
    try {
      onSaved(await request<Catalog>("/api/admin/library/recommendations", { method: "DELETE", body: JSON.stringify({ id }) }));
    } catch (saveError) {
      onError((saveError as Error).message);
    }
  }

  return (
    <div className="space-y-5 border-t bg-muted/20 p-3">
      <form className="space-y-3" onSubmit={(event) => void saveVideo(event)}>
        <div className="space-y-1.5">
          <Label htmlFor={`${page.id}-url`}>Видео – ссылка на YouTube</Label>
          <Input id={`${page.id}-url`} name="video" className="h-11" placeholder="https://youtu.be/…" defaultValue={page.videoUrl ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${page.id}-body`}>Текст под видео</Label>
          <Textarea id={`${page.id}-body`} name="body" className="min-h-40" defaultValue={page.body} />
        </div>
        <Button type="submit" className="h-11">
          Сохранить видео и текст
        </Button>
      </form>
      <RecommendationList title="Книги" items={page.books} onRemove={(id) => void removeItem(id)} note={(item) => item.author ?? ""} />
      <form className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => void addItem("book", event)}>
        <Input name="title" className="h-11" placeholder="Название книги" required aria-label={`Название книги, стихия ${element.name}`} />
        <Input name="author" className="h-11" placeholder="Автор" required aria-label="Автор книги" />
        <Button type="submit" variant="outline" className="h-11">
          Добавить книгу
        </Button>
      </form>
      <RecommendationList title="Фильмы" items={page.films} onRemove={(id) => void removeItem(id)} note={(item) => (item.year ? String(item.year) : "")} />
      <form className="grid gap-2 sm:grid-cols-[1fr_140px_auto]" onSubmit={(event) => void addItem("film", event)}>
        <Input name="title" className="h-11" placeholder="Название фильма" required aria-label={`Название фильма, стихия ${element.name}`} />
        <Input name="year" className="h-11" type="number" placeholder="Год" aria-label="Год фильма" />
        <Button type="submit" variant="outline" className="h-11">
          Добавить фильм
        </Button>
      </form>
    </div>
  );
}

function RecommendationList({
  title,
  items,
  note,
  onRemove,
}: {
  title: string;
  items: Recommendation[];
  note: (item: Recommendation) => string;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium">{title}</h3>
      {items.length === 0 && <p className="text-sm text-muted-foreground">Пока пусто.</p>}
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <span className="min-w-0 flex-1 text-sm">
            {item.title}
            {note(item) ? <span className="text-muted-foreground"> · {note(item)}</span> : null}
          </span>
          <Button variant="ghost" size="icon" className="size-11" aria-label={`Удалить «${item.title}»`} onClick={() => onRemove(item.id)}>
            <Trash2 />
          </Button>
        </div>
      ))}
    </div>
  );
}

function PracticeForm({
  practice,
  submitLabel,
  onSubmit,
}: {
  practice?: Practice;
  submitLabel: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const welcome = practice?.id === "welcome";
  const [kind, setKind] = useState<"video" | "audio">(practice?.kind ?? "video");
  return (
    <form className="mt-3 space-y-3 rounded-xl border bg-background p-3" onSubmit={onSubmit}>
      {!welcome && (
        <div className="space-y-1.5">
          <Label htmlFor={`title-${practice?.id ?? "new"}`}>Название</Label>
          <Input id={`title-${practice?.id ?? "new"}`} name="title" className="h-11" required defaultValue={practice?.title ?? ""} />
        </div>
      )}
      {!welcome && (
        <div className="space-y-1.5">
          <Label htmlFor={`kind-${practice?.id ?? "new"}`}>Видео или аудио</Label>
          <select
            id={`kind-${practice?.id ?? "new"}`}
            name="kind"
            className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
            value={kind}
            onChange={(event) => setKind(event.target.value === "audio" ? "audio" : "video")}
          >
            <option value="video">Видео</option>
            <option value="audio">Аудио</option>
          </select>
        </div>
      )}
      {(welcome || kind === "video") && (
        <div className="space-y-1.5">
          <Label htmlFor={`video-${practice?.id ?? "new"}`}>Ссылка на YouTube</Label>
          <Input id={`video-${practice?.id ?? "new"}`} name="video" className="h-11" placeholder="https://youtu.be/…" defaultValue={practice?.videoUrl ?? ""} />
        </div>
      )}
      {!welcome && kind === "audio" && (
        <div className="space-y-1.5">
          <Label htmlFor={`audio-${practice?.id ?? "new"}`}>Аудиофайл</Label>
          <Input id={`audio-${practice?.id ?? "new"}`} name="audio" type="file" accept="audio/mpeg,audio/mp4,audio/wav,audio/webm" className="h-11" />
          {practice?.hasAudio && <p className="text-xs text-muted-foreground">Файл уже есть. Новый заменит его.</p>}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor={`body-${practice?.id ?? "new"}`}>Текст</Label>
        <Textarea id={`body-${practice?.id ?? "new"}`} name="body" className="min-h-24" defaultValue={practice?.body ?? ""} />
      </div>
      <Button type="submit" className="h-11">
        {submitLabel}
      </Button>
    </form>
  );
}
