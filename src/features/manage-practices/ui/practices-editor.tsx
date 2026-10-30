"use client";

import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { request } from "@/shared/api/request";
import { isStaticPrototype } from "@/shared/config/env";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NativeSelect } from "@/shared/ui/native-select";
import { Textarea } from "@/shared/ui/textarea";

type Frequency = "daily" | "weekly";
type Daypart = "morning" | "evening";

type Practice = {
  id: string;
  title: string;
  frequency: Frequency;
  daypart: Daypart | null;
  position: number;
  body: string;
  videoUrl: string | null;
  opensOnDay: number;
};

type Draft = Omit<Practice, "id" | "videoUrl"> & { id?: string; videoUrl: string };

type ListState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; practices: Practice[] };

const daypartNames: Record<Daypart, string> = { morning: "Утро", evening: "Вечер" };

function emptyDraft(frequency: Frequency, position: number): Draft {
  return {
    title: "",
    frequency,
    daypart: frequency === "daily" ? "morning" : null,
    position,
    body: "",
    videoUrl: "",
    opensOnDay: 1,
  };
}

/** Практики одного вида: ежедневные (утро и вечер) или еженедельные. Список, правка, добавление. */
export function PracticesEditor({ frequency }: { frequency: Frequency }) {
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (isStaticPrototype) return;
    request<Practice[]>("/api/admin/practices")
      .then((practices) => setState({ status: "ready", practices }))
      .catch((loadError: Error) => setState({ status: "error", message: loadError.message }));
  }, []);

  useEffect(load, [load]);

  const practices = state.status === "ready" ? state.practices.filter((item) => item.frequency === frequency) : [];
  const groups: { title: string | null; items: Practice[] }[] =
    frequency === "daily"
      ? (["morning", "evening"] as const).map((daypart) => ({
          title: daypartNames[daypart],
          items: practices.filter((item) => item.daypart === daypart),
        }))
      : [{ title: null, items: practices }];

  function open(item: Practice) {
    setError(null);
    if (openId === item.id) return close();
    setOpenId(item.id);
    setDraft({ ...item, videoUrl: item.videoUrl ?? "" });
  }

  function startNew() {
    setError(null);
    setOpenId("new");
    setDraft(emptyDraft(frequency, practices.length + 1));
  }

  function close() {
    setOpenId(null);
    setDraft(null);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setPending(true);
    setError(null);
    try {
      await request("/api/admin/practices", { method: "POST", body: JSON.stringify(draft) });
      close();
      load();
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function remove(item: Practice) {
    if (!window.confirm(`Удалить практику «${item.title}»? Отметки людей по ней тоже удалятся.`)) return;
    try {
      await request("/api/admin/practices", { method: "DELETE", body: JSON.stringify({ id: item.id }) });
      close();
      load();
    } catch (removeError) {
      setError((removeError as Error).message);
    }
  }

  const form = draft && (
    <form className="space-y-3 border-t bg-muted/30 p-4" onSubmit={(event) => void save(event)}>
      <div className="space-y-1.5">
        <Label htmlFor="practice-title">Название</Label>
        <Input
          id="practice-title"
          className="h-11"
          required
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {frequency === "daily" && (
          <div className="space-y-1.5">
            <Label htmlFor="practice-daypart">Когда</Label>
            <NativeSelect
              id="practice-daypart"
              className="h-11"
              value={draft.daypart ?? "morning"}
              onChange={(event) => setDraft({ ...draft, daypart: event.target.value as Daypart })}
            >
              <option value="morning">Утро</option>
              <option value="evening">Вечер</option>
            </NativeSelect>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="practice-position">Место в списке</Label>
          <Input
            id="practice-position"
            type="number"
            min={1}
            className="h-11"
            value={draft.position}
            onChange={(event) => setDraft({ ...draft, position: Number(event.target.value) })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="practice-day">Появляется с дня программы</Label>
          <Input
            id="practice-day"
            type="number"
            min={1}
            className="h-11"
            value={draft.opensOnDay}
            onChange={(event) => setDraft({ ...draft, opensOnDay: Number(event.target.value) })}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="practice-body">Текст</Label>
        <Textarea
          id="practice-body"
          className="min-h-32"
          value={draft.body}
          onChange={(event) => setDraft({ ...draft, body: event.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="practice-video">Видео — ссылка на YouTube</Label>
        <Input
          id="practice-video"
          className="h-11"
          placeholder="https://youtu.be/…"
          value={draft.videoUrl}
          onChange={(event) => setDraft({ ...draft, videoUrl: event.target.value })}
        />
      </div>
      <p className="text-xs text-muted-foreground">Аудио можно будет загрузить, когда появится хранение файлов на сервере.</p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="h-11" disabled={pending}>
          Сохранить
        </Button>
        <Button type="button" variant="ghost" className="h-11" onClick={close}>
          Отмена
        </Button>
      </div>
    </form>
  );

  if (isStaticPrototype) return <p className="text-sm text-muted-foreground">На этом сайте нет сервера.</p>;

  return (
    <div className="space-y-5">
      {state.status === "loading" && <p className="text-sm text-muted-foreground">Загружаем…</p>}
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {state.status === "ready" &&
        groups.map((group) => (
          <section key={group.title ?? "all"} className="space-y-2">
            {group.title && <h2 className="font-semibold">{group.title}</h2>}
            <ul className="divide-y overflow-hidden rounded-2xl border bg-background">
              {group.items.length === 0 && <li className="p-4 text-sm text-muted-foreground">Пока пусто.</li>}
              {group.items.map((item) => (
                <li key={item.id}>
                  <div className="flex items-center gap-2 pr-2">
                    <button
                      type="button"
                      className="flex min-h-14 flex-1 items-center gap-3 px-4 py-2 text-left hover:bg-muted/50"
                      aria-expanded={openId === item.id}
                      onClick={() => open(item)}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{item.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          с {item.opensOnDay}-го дня
                          {item.videoUrl ? " · видео" : ""}
                          {item.body ? "" : " · без текста"}
                        </span>
                      </span>
                      <ChevronDown className="size-4 text-muted-foreground" />
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11"
                      aria-label={`Удалить ${item.title}`}
                      onClick={() => void remove(item)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  {openId === item.id && form}
                </li>
              ))}
            </ul>
          </section>
        ))}

      {openId === "new" ? (
        <div className="overflow-hidden rounded-2xl border bg-background">{form}</div>
      ) : (
        <Button variant="outline" className="h-11" onClick={startNew}>
          <Plus />
          Добавить практику
        </Button>
      )}
    </div>
  );
}
