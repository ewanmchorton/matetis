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

type Part = { title: string; body: string; firstDayTask: string; secondDayTask: string };
type Message = {
  id: string;
  masterName: string;
  position: number;
  day7Task: string | null;
  typeIds: string[];
  parts: { part: number; title: string; body: string; firstDayTask: string | null; secondDayTask: string | null }[];
};
type Draft = { id?: string; masterName: string; position: number; day7Task: string; typeIds: string[]; parts: Part[] };
type ListState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; messages: Message[] };

const types = getPersonTypes();
const emptyPart = (): Part => ({ title: "", body: "", firstDayTask: "", secondDayTask: "" });

function toDraft(message: Message): Draft {
  return {
    id: message.id,
    masterName: message.masterName,
    position: message.position,
    day7Task: message.day7Task ?? "",
    typeIds: message.typeIds,
    parts: [1, 2, 3].map((number) => {
      const part = message.parts.find((item) => item.part === number);
      return {
        title: part?.title ?? "",
        body: part?.body ?? "",
        firstDayTask: part?.firstDayTask ?? "",
        secondDayTask: part?.secondDayTask ?? "",
      };
    }),
  };
}

function typeNames(typeIds: string[]) {
  return types
    .filter((type) => typeIds.includes(type.id))
    .map((type) => type.name)
    .join(", ");
}

/** Раздел «Навигатор»: послания Мастеров из трёх частей, по порядку для своих типов. */
export function AdminNavigatorPage() {
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (isStaticPrototype) return;
    request<Message[]>("/api/admin/navigator")
      .then((messages) => setState({ status: "ready", messages }))
      .catch((loadError: Error) => setState({ status: "error", message: loadError.message }));
  }, []);

  useEffect(load, [load]);

  const messages = state.status === "ready" ? state.messages : [];

  function close() {
    setOpenId(null);
    setDraft(null);
  }

  function open(message: Message) {
    setError(null);
    if (openId === message.id) return close();
    setOpenId(message.id);
    setDraft(toDraft(message));
  }

  function startNew() {
    setError(null);
    setOpenId("new");
    setDraft({
      masterName: "",
      position: messages.length + 1,
      day7Task: "",
      typeIds: [],
      parts: [emptyPart(), emptyPart(), emptyPart()],
    });
  }

  function setPart(index: number, change: Partial<Part>) {
    if (!draft) return;
    setDraft({ ...draft, parts: draft.parts.map((part, i) => (i === index ? { ...part, ...change } : part)) });
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
      await request("/api/admin/navigator", { method: "POST", body: JSON.stringify(draft) });
      close();
      load();
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function remove(message: Message) {
    if (!window.confirm(`Удалить послание Мастера ${message.masterName}?`)) return;
    try {
      await request("/api/admin/navigator", { method: "DELETE", body: JSON.stringify({ id: message.id }) });
      close();
      load();
    } catch (removeError) {
      setError((removeError as Error).message);
    }
  }

  const form = draft && (
    <form className="space-y-5 border-t bg-muted/30 p-4" onSubmit={(event) => void save(event)}>
      <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
        <div className="space-y-1.5">
          <Label htmlFor="master-name">Имя Мастера</Label>
          <Input
            id="master-name"
            className="h-11"
            required
            value={draft.masterName}
            onChange={(event) => setDraft({ ...draft, masterName: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="message-position">Порядок</Label>
          <Input
            id="message-position"
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

      {draft.parts.map((part, index) => (
        <fieldset key={index} className="space-y-3 rounded-xl border bg-background p-4">
          <legend className="px-1 text-sm font-medium">
            Часть {index + 1} · дни {index * 2 + 1} и {index * 2 + 2}
          </legend>
          <div className="space-y-1.5">
            <Label htmlFor={`part-${index}-title`}>Заголовок — его видно на карточке программы</Label>
            <Input
              id={`part-${index}-title`}
              className="h-11"
              required
              value={part.title}
              onChange={(event) => setPart(index, { title: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`part-${index}-body`}>Текст</Label>
            <Textarea
              id={`part-${index}-body`}
              className="min-h-40"
              required
              value={part.body}
              onChange={(event) => setPart(index, { body: event.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`part-${index}-task1`}>Задание {index * 2 + 1}-го дня</Label>
              <Textarea
                id={`part-${index}-task1`}
                required={index === 0}
                placeholder={index === 0 ? "" : "Пусто — как в 1-й день"}
                value={part.firstDayTask}
                onChange={(event) => setPart(index, { firstDayTask: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`part-${index}-task2`}>Задание {index * 2 + 2}-го дня</Label>
              <Textarea
                id={`part-${index}-task2`}
                required={index === 0}
                placeholder={index === 0 ? "" : "Пусто — как во 2-й день"}
                value={part.secondDayTask}
                onChange={(event) => setPart(index, { secondDayTask: event.target.value })}
              />
            </div>
          </div>
        </fieldset>
      ))}

      <div className="space-y-1.5">
        <Label htmlFor="day7-task">Задание 7-го дня, когда послание читают полностью (можно оставить пустым)</Label>
        <Textarea
          id="day7-task"
          value={draft.day7Task}
          onChange={(event) => setDraft({ ...draft, day7Task: event.target.value })}
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

  if (isStaticPrototype) return <h1 className="text-2xl font-semibold">Навигатор</h1>;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Навигатор</h1>
        <p className="text-sm text-muted-foreground">
          Одно послание — на неделю: по два дня на каждую часть, на 7-й день всё послание целиком. Послания идут по
          порядку для своих типов, потом сначала.
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
          {messages.length === 0 && <li className="p-4 text-sm text-muted-foreground">Посланий пока нет.</li>}
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
                    <span className="block font-medium">{message.masterName}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {message.parts[0]?.title} · {typeNames(message.typeIds)}
                    </span>
                  </span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  aria-label={`Удалить послание ${message.masterName}`}
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
          Добавить послание
        </Button>
      )}
    </div>
  );
}
