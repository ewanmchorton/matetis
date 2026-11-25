"use client";

import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { getPersonTypes } from "@/entities/person-type";
import { request } from "@/shared/api/request";
import { isStaticPrototype } from "@/shared/config/env";
import { previewNavigatorMessages } from "@/shared/demo/admin-preview";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

type Part = { title: string; body: string; firstDayTask: string; secondDayTask: string };
type Message = {
  id: string;
  title: string;
  masterName: string;
  givenOn: string;
  intro: string;
  closing: string;
  position: number;
  day7Task: string | null;
  typeIds: string[];
  parts: { part: number; title: string; body: string; firstDayTask: string | null; secondDayTask: string | null }[];
};
type Draft = Omit<Message, "id" | "day7Task" | "parts"> & { id?: string; day7Task: string; parts: Part[] };
type ListState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; messages: Message[] };

const types = getPersonTypes();
const emptyPart = (): Part => ({ title: "", body: "", firstDayTask: "", secondDayTask: "" });
const exampleMessages = previewNavigatorMessages();

function toDraft(message: Message): Draft {
  return {
    id: message.id,
    title: message.title,
    masterName: message.masterName,
    givenOn: message.givenOn,
    intro: message.intro,
    closing: message.closing,
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

/** Раздел «Навигатор»: послания Мастеров из трёх частей, по порядку для своих типов. */
export function AdminNavigatorPage() {
  const [state, setState] = useState<ListState>(
    isStaticPrototype ? { status: "ready", messages: exampleMessages } : { status: "loading" },
  );
  const [openId, setOpenId] = useState<string | null>(isStaticPrototype ? (exampleMessages[0]?.id ?? null) : null);
  const [draft, setDraft] = useState<Draft | null>(isStaticPrototype && exampleMessages[0] ? toDraft(exampleMessages[0]) : null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openType, setOpenType] = useState("t1");
  const [dragId, setDragId] = useState<string | null>(null);

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
    const typeId = message.typeIds[0];
    const place = messages
      .filter((item) => item.typeIds[0] === typeId)
      .sort((a, b) => a.position - b.position)
      .findIndex((item) => item.id === message.id);
    setDraft({ ...toDraft(message), position: place + 1, typeIds: typeId ? [typeId] : [] });
  }

  function startNew() {
    setError(null);
    setOpenId("new");
    setDraft({
      title: "",
      masterName: "",
      givenOn: "",
      intro: "",
      closing: "",
      position: 1,
      day7Task: "",
      typeIds: [],
      parts: [emptyPart(), emptyPart(), emptyPart()],
    });
  }

  function setPart(index: number, change: Partial<Part>) {
    if (!draft) return;
    setDraft({ ...draft, parts: draft.parts.map((part, i) => (i === index ? { ...part, ...change } : part)) });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setPending(true);
    setError(null);
    try {
      const saved = await request<Message>("/api/admin/navigator", { method: "POST", body: JSON.stringify(draft) });
      const typeId = draft.typeIds[0];
      if (typeId && state.status === "ready") {
        const queue = state.messages
          .filter((item) => item.id !== saved.id && item.typeIds[0] === typeId)
          .sort((a, b) => a.position - b.position);
        const index = Math.min(Math.max(draft.position, 1), queue.length + 1) - 1;
        queue.splice(index, 0, saved);
        await request("/api/admin/navigator/order", {
          method: "PUT",
          body: JSON.stringify({ typeId, ids: queue.map((item) => item.id) }),
        });
      }
      close();
      load();
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function remove(message: Message) {
    if (!window.confirm(`Удалить послание «${message.title}»?`)) return;
    try {
      await request("/api/admin/navigator", { method: "DELETE", body: JSON.stringify({ id: message.id }) });
      close();
      load();
    } catch (removeError) {
      setError((removeError as Error).message);
    }
  }

  async function dropMessage(typeId: string, targetId: string) {
    if (!dragId || dragId === targetId || state.status !== "ready") return;
    const queue = state.messages
      .filter((item) => item.typeIds[0] === typeId)
      .sort((a, b) => a.position - b.position);
    const from = queue.findIndex((item) => item.id === dragId);
    const to = queue.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = queue.splice(from, 1);
    queue.splice(to, 0, moved);
    setDragId(null);
    try {
      await request("/api/admin/navigator/order", {
        method: "PUT",
        body: JSON.stringify({ typeId, ids: queue.map((item) => item.id) }),
      });
      load();
    } catch (dropError) {
      setError((dropError as Error).message);
    }
  }

  const form = draft && (
    <form className="space-y-5 border-t bg-muted/30 p-4" onSubmit={(event) => void save(event)}>
      <div className="space-y-1.5">
        <Label htmlFor="message-title">Название послания</Label>
        <Input
          id="message-title"
          className="h-11"
          required
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_180px_120px]">
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
          <Label htmlFor="message-date">Дата послания</Label>
          <Input
            id="message-date"
            type="date"
            className="h-11"
            required
            value={draft.givenOn}
            onChange={(event) => setDraft({ ...draft, givenOn: event.target.value })}
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

      <div className="space-y-1.5">
        <Label htmlFor="message-type">Тип</Label>
        <select
          id="message-type"
          className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
          required
          value={draft.typeIds[0] ?? ""}
          onChange={(event) => setDraft({ ...draft, typeIds: event.target.value ? [event.target.value] : [] })}
        >
          <option value="">Выберите тип</option>
          {types.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
          </select>
        </div>

      <div className="space-y-1.5">
        <Label htmlFor="message-intro">Вступление – его читают на 7-й день</Label>
        <Textarea
          id="message-intro"
          className="min-h-28"
          required
          value={draft.intro}
          onChange={(event) => setDraft({ ...draft, intro: event.target.value })}
        />
      </div>

      {draft.parts.map((part, index) => (
        <fieldset key={index} className="space-y-3 rounded-xl border bg-background p-4">
          <legend className="px-1 text-sm font-medium">
            Часть {index + 1} · дни {index * 2 + 1} и {index * 2 + 2}
          </legend>
          <div className="space-y-1.5">
            <Label htmlFor={`part-${index}-title`}>Название части – его видно на карточке программы</Label>
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
                required
                value={part.firstDayTask}
                onChange={(event) => setPart(index, { firstDayTask: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`part-${index}-task2`}>Задание {index * 2 + 2}-го дня</Label>
              <Textarea
                id={`part-${index}-task2`}
                placeholder={`Пусто – как в ${index * 2 + 1}-й день`}
                value={part.secondDayTask}
                onChange={(event) => setPart(index, { secondDayTask: event.target.value })}
              />
            </div>
          </div>
        </fieldset>
      ))}

      <div className="space-y-1.5">
        <Label htmlFor="message-closing">Завершение – его читают на 7-й день</Label>
        <Textarea
          id="message-closing"
          required
          value={draft.closing}
          onChange={(event) => setDraft({ ...draft, closing: event.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="day7-task">Задание 7-го дня: послание читают полностью (можно оставить пустым)</Label>
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

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Навигатор</h1>
      </div>

      <div className="sticky top-0 z-10 bg-muted/40 py-2">
        {openId === "new" ? (
          <div className="overflow-hidden rounded-2xl border bg-background">{form}</div>
        ) : (
          <Button variant="outline" className="h-11" onClick={startNew}>
            <Plus />
            Добавить послание
          </Button>
        )}
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

      {state.status === "ready" &&
        types.map((type) => {
          const queue = messages.filter((item) => item.typeIds[0] === type.id).sort((a, b) => a.position - b.position);
          const shown = openType === type.id;
          return (
            <section key={type.id} className="overflow-hidden rounded-2xl border bg-background">
              <button type="button" className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpenType(shown ? "" : type.id)}>
                <span className="flex-1 font-semibold">{type.name}</span>
                <span className="text-xs text-muted-foreground">{queue.length ? `${queue.length} в очереди` : "пока пусто"}</span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>
              {shown && (
                <div className="space-y-2 border-t p-3">
                  {queue.length === 0 && <p className="text-sm text-muted-foreground">Пока пусто.</p>}
                  {queue.map((message, index) => (
                    <div key={message.id} onDragOver={(event) => event.preventDefault()} onDrop={() => void dropMessage(type.id, message.id)}>
                      <div className="flex items-center gap-2">
                        <span draggable className="cursor-grab px-1 text-muted-foreground" onDragStart={() => setDragId(message.id)}>
                          ⋮⋮
                        </span>
                        <button type="button" className="min-w-0 flex-1 py-2 text-left" aria-expanded={openId === message.id} onClick={() => open(message)}>
                          <span className="text-sm text-muted-foreground">{index + 1}. </span>
                          <span className="font-medium">{message.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">{message.masterName}</span>
                        </button>
                        <Button variant="ghost" size="icon" className="size-11" aria-label={`Удалить послание «${message.title}»`} onClick={() => void remove(message)}>
                          <Trash2 />
                        </Button>
                      </div>
                      {openId === message.id && form}
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
    </div>
  );
}
