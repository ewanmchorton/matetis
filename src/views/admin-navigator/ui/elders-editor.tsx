"use client";

import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { getPersonTypes } from "@/entities/person-type";
import { request } from "@/shared/api/request";
import { isStaticPrototype } from "@/shared/config/env";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

type Elders = { id: string; title: string; body: string; position: number; typeIds: string[] };
type Draft = Omit<Elders, "id"> & { id?: string };
type ListState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; messages: Elders[] };

const types = getPersonTypes();

/** Послания старцев на 6-й и 7-й день навигатора: по порядку для своих типов, по кругу. */
export function EldersEditor() {
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (isStaticPrototype) return;
    request<Elders[]>("/api/admin/elders")
      .then((messages) => setState({ status: "ready", messages }))
      .catch((loadError: Error) => setState({ status: "error", message: loadError.message }));
  }, []);

  useEffect(load, [load]);

  const messages = state.status === "ready" ? state.messages : [];

  function close() {
    setOpenId(null);
    setDraft(null);
  }

  function open(message: Elders) {
    setError(null);
    if (openId === message.id) return close();
    setOpenId(message.id);
    setDraft(message);
  }

  function startNew() {
    setError(null);
    setOpenId("new");
    setDraft({ title: "", body: "", position: messages.length + 1, typeIds: [] });
  }

  function toggleType(id: string) {
    if (!draft) return;
    const typeIds = draft.typeIds.includes(id) ? draft.typeIds.filter((item) => item !== id) : [...draft.typeIds, id];
    setDraft({ ...draft, typeIds });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setPending(true);
    setError(null);
    try {
      await request("/api/admin/elders", { method: "POST", body: JSON.stringify(draft) });
      close();
      load();
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function remove(message: Elders) {
    if (!window.confirm(`Удалить послание старцев «${message.title}»?`)) return;
    try {
      await request("/api/admin/elders", { method: "DELETE", body: JSON.stringify({ id: message.id }) });
      close();
      load();
    } catch (removeError) {
      setError((removeError as Error).message);
    }
  }

  const form = draft && (
    <form className="space-y-4 border-t bg-muted/30 p-4" onSubmit={(event) => void save(event)}>
      <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
        <div className="space-y-1.5">
          <Label htmlFor="elders-title">Заголовок — его видно на карточке программы</Label>
          <Input
            id="elders-title"
            className="h-11"
            required
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="elders-position">Порядок</Label>
          <Input
            id="elders-position"
            type="number"
            min={1}
            className="h-11"
            value={draft.position}
            onChange={(event) => setDraft({ ...draft, position: Number(event.target.value) })}
          />
        </div>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Каким типам подходит</legend>
        <div className="flex flex-wrap gap-2">
          {types.map((type) => (
            <button
              key={type.id}
              type="button"
              aria-pressed={draft.typeIds.includes(type.id)}
              onClick={() => toggleType(type.id)}
              className={cn(
                "min-h-9 rounded-full border px-3 text-sm",
                draft.typeIds.includes(type.id)
                  ? "border-primary bg-primary/10 text-primary"
                  : "bg-background text-muted-foreground",
              )}
            >
              {type.name}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="space-y-1.5">
        <Label htmlFor="elders-body">Текст</Label>
        <Textarea
          id="elders-body"
          className="min-h-40"
          required
          value={draft.body}
          onChange={(event) => setDraft({ ...draft, body: event.target.value })}
        />
      </div>
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

  if (isStaticPrototype) return null;

  return (
    <section className="space-y-3 pt-4">
      <div className="space-y-1">
        <h2 className="font-semibold">Послания старцев</h2>
        <p className="text-sm text-muted-foreground">
          На 6-й и 7-й день недели навигатора, одно и то же оба дня. Задания — как в 1-й и 2-й день послания Мастера.
        </p>
      </div>
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
      {state.status === "ready" && (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-background">
          {messages.length === 0 && <li className="p-4 text-sm text-muted-foreground">Посланий старцев пока нет.</li>}
          {messages.map((message) => (
            <li key={message.id}>
              <div className="flex items-center gap-2 pr-2">
                <button
                  type="button"
                  className="flex min-h-14 flex-1 items-center gap-3 px-4 py-2 text-left hover:bg-muted/50"
                  aria-expanded={openId === message.id}
                  onClick={() => open(message)}
                >
                  <span className="w-8 text-sm text-muted-foreground">{message.position}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{message.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {types
                        .filter((type) => message.typeIds.includes(type.id))
                        .map((type) => type.name)
                        .join(", ")}
                    </span>
                  </span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  aria-label={`Удалить послание старцев ${message.title}`}
                  onClick={() => void remove(message)}
                >
                  <Trash2 />
                </Button>
              </div>
              {openId === message.id && form}
            </li>
          ))}
        </ul>
      )}
      {openId === "new" ? (
        <div className="overflow-hidden rounded-2xl border bg-background">{form}</div>
      ) : (
        <Button variant="outline" className="h-11" onClick={startNew}>
          <Plus />
          Добавить послание старцев
        </Button>
      )}
    </section>
  );
}
