"use client";

import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { PHRASE_MAX_LENGTH, type DailyPhraseDto } from "@/entities/daily-phrase";
import { getPersonTypes } from "@/entities/person-type";
import { request } from "@/shared/api/request";
import { isStaticPrototype } from "@/shared/config/env";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";

type ListState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; phrases: DailyPhraseDto[] };

const types = getPersonTypes();

function typeNames(typeIds: string[]) {
  if (typeIds.length === 0) return "Всем типам";
  return types
    .filter((type) => typeIds.includes(type.id))
    .map((type) => type.name)
    .join(", ");
}

/** Фразы дня: короткие цитаты, которые раз в день приходят людям уведомлением. Вкладка раздела «Практики». */
export function PhrasesEditor() {
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [text, setText] = useState("");
  const [typeIds, setTypeIds] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (isStaticPrototype) return;
    request<DailyPhraseDto[]>("/api/admin/phrases")
      .then((phrases) => setState({ status: "ready", phrases }))
      .catch((loadError: Error) => setState({ status: "error", message: loadError.message }));
  }, []);

  useEffect(load, [load]);

  function toggleType(id: string) {
    setTypeIds((current) => (current.includes(id) ? current.filter((typeId) => typeId !== id) : [...current, id]));
  }

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await request("/api/admin/phrases", { method: "POST", body: JSON.stringify({ text, typeIds }) });
      setText("");
      setTypeIds([]);
      load();
    } catch (addError) {
      setError((addError as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function remove(phrase: DailyPhraseDto) {
    if (!window.confirm(`Удалить фразу «${phrase.text}»?`)) return;
    try {
      await request("/api/admin/phrases", { method: "DELETE", body: JSON.stringify({ id: phrase.id }) });
      load();
    } catch (removeError) {
      setError((removeError as Error).message);
    }
  }

  if (isStaticPrototype) {
    return <p className="text-sm text-muted-foreground">На этом сайте нет сервера: фразы добавляются в рабочем приложении.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Раз в день в случайное время фраза приходит человеку уведомлением — в промежутке, который он выбрал в профиле.
          В приложении фразы не показываются.
        </p>
      </div>

      <form className="space-y-3 rounded-2xl border bg-background p-4" onSubmit={(event) => void add(event)}>
        <Textarea
          aria-label="Текст фразы"
          placeholder="Стараясь осчастливить других, мы находим своё собственное (Платон)"
          className="min-h-24"
          maxLength={PHRASE_MAX_LENGTH}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <fieldset className="space-y-2">
          <legend className="text-sm text-muted-foreground">Каким типам подходит. Не отмечено ничего — всем.</legend>
          <div className="flex flex-wrap gap-2">
            {types.map((type) => (
              <button
                key={type.id}
                type="button"
                aria-pressed={typeIds.includes(type.id)}
                onClick={() => toggleType(type.id)}
                className={cn(
                  "min-h-9 rounded-full border px-3 text-sm",
                  typeIds.includes(type.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "bg-background text-muted-foreground",
                )}
              >
                {type.name}
              </button>
            ))}
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="h-11 w-full" disabled={pending || !text.trim()}>
          Добавить фразу
        </Button>
      </form>

      <section className="rounded-2xl border bg-background">
        {state.status === "loading" && <p className="p-4 text-sm text-muted-foreground">Загружаем…</p>}
        {state.status === "error" && (
          <p role="alert" className="p-4 text-sm text-destructive">
            {state.message}
          </p>
        )}
        {state.status === "ready" && state.phrases.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">Фраз пока нет.</p>
        )}
        <ul className="divide-y">
          {state.status === "ready" &&
            state.phrases.map((phrase) => (
              <li key={phrase.id} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <p>{phrase.text}</p>
                  <p className="text-xs text-muted-foreground">{typeNames(phrase.typeIds)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Удалить фразу"
                  className="size-11 shrink-0"
                  onClick={() => void remove(phrase)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
