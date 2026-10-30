"use client";

import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { getElements, type ElementId } from "@/entities/element";
import { getPersonTypes } from "@/entities/person-type";
import { request } from "@/shared/api/request";
import { isStaticPrototype } from "@/shared/config/env";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NativeSelect } from "@/shared/ui/native-select";
import { Textarea } from "@/shared/ui/textarea";

type Frequency = "daily" | "weekly" | "awareness";
type Daypart = "morning" | "evening";
type Alternation = "first" | "second" | null;

type Variant = {
  body: string;
  videoUrl: string | null;
  typeIds: string[];
  weakElement: ElementId | null;
  seasonElement: ElementId | null;
};

type Practice = {
  id: string;
  title: string;
  frequency: Frequency;
  daypart: Daypart | null;
  position: number;
  body: string;
  videoUrl: string | null;
  opensOnDay: number;
  newEachWeek: boolean;
  alternation: Alternation;
  variants: Variant[];
};

type Draft = Omit<Practice, "id" | "videoUrl"> & { id?: string; videoUrl: string };

const types = getPersonTypes();
const elements = getElements();
const emptyVariant = (): Variant => ({ body: "", videoUrl: "", typeIds: [], weakElement: null, seasonElement: null });

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
    newEachWeek: false,
    alternation: null,
    variants: [],
  };
}

/** Кому достаётся вариант — коротко для заголовка. */
function variantAudience(variant: Variant) {
  const parts = [
    variant.typeIds.length > 0
      ? types
          .filter((type) => variant.typeIds.includes(type.id))
          .map((type) => type.name)
          .join(", ")
      : "все типы",
  ];
  if (variant.weakElement) parts.push(`слабая ${elements.find((item) => item.id === variant.weakElement)?.name}`);
  if (variant.seasonElement) parts.push(`стихия года ${elements.find((item) => item.id === variant.seasonElement)?.name}`);
  return parts.join(" · ");
}

/** Варианты текста практики: для типов, слабой стихии, стихии года. */
function VariantsEditor({ variants, onChange }: { variants: Variant[]; onChange: (variants: Variant[]) => void }) {
  const set = (index: number, change: Partial<Variant>) =>
    onChange(variants.map((variant, i) => (i === index ? { ...variant, ...change } : variant)));

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Варианты</legend>
      <p className="text-xs text-muted-foreground">
        Нет вариантов — текст выше видят все. Есть варианты — человек видит подходящий ему, а если не подошёл ни
        один, практики у него нет. Типы не отмечены — вариант для всех типов.
      </p>
      {variants.map((variant, index) => (
        <div key={index} className="space-y-3 rounded-xl border bg-background p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium">
              Вариант {index + 1}
              <span className="block text-xs font-normal text-muted-foreground">{variantAudience(variant)}</span>
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label={`Удалить вариант ${index + 1}`}
              onClick={() => onChange(variants.filter((_, i) => i !== index))}
            >
              <Trash2 />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Для каких типов">
            {types.map((type) => {
              const on = variant.typeIds.includes(type.id);
              return (
                <button
                  key={type.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    set(index, {
                      typeIds: on ? variant.typeIds.filter((id) => id !== type.id) : [...variant.typeIds, type.id],
                    })
                  }
                  className={cn(
                    "min-h-9 rounded-full border px-3 text-sm",
                    on ? "border-primary bg-primary/10 text-primary" : "bg-background text-muted-foreground",
                  )}
                >
                  {type.name}
                </button>
              );
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`variant-${index}-weak`}>Для слабой стихии</Label>
              <NativeSelect
                id={`variant-${index}-weak`}
                className="h-11"
                value={variant.weakElement ?? ""}
                onChange={(event) => set(index, { weakElement: (event.target.value || null) as ElementId | null })}
              >
                <option value="">Для любой</option>
                {elements.map((element) => (
                  <option key={element.id} value={element.id}>
                    {element.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`variant-${index}-season`}>На стихию года</Label>
              <NativeSelect
                id={`variant-${index}-season`}
                className="h-11"
                value={variant.seasonElement ?? ""}
                onChange={(event) => set(index, { seasonElement: (event.target.value || null) as ElementId | null })}
              >
                <option value="">На любую</option>
                {elements.map((element) => (
                  <option key={element.id} value={element.id}>
                    {element.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`variant-${index}-body`}>Текст</Label>
            <Textarea
              id={`variant-${index}-body`}
              className="min-h-24"
              value={variant.body}
              onChange={(event) => set(index, { body: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`variant-${index}-video`}>Видео — ссылка на YouTube</Label>
            <Input
              id={`variant-${index}-video`}
              className="h-11"
              placeholder="https://youtu.be/…"
              value={variant.videoUrl ?? ""}
              onChange={(event) => set(index, { videoUrl: event.target.value })}
            />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" className="h-11" onClick={() => onChange([...variants, emptyVariant()])}>
        <Plus />
        Добавить вариант
      </Button>
    </fieldset>
  );
}

/** Практики одного вида: ежедневные (утро и вечер), еженедельные или осознания. Список, правка, добавление. */
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
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          className="size-5"
          checked={draft.newEachWeek}
          onChange={(event) => setDraft({ ...draft, newEachWeek: event.target.checked })}
        />
        Каждую неделю новый вариант — по порядку, потом по кругу
      </label>
      {frequency === "weekly" && (
        <div className="space-y-1.5">
          <Label htmlFor="practice-alternation">С 15-го дня чередуется по неделям</Label>
          <NativeSelect
            id="practice-alternation"
            className="h-11"
            value={draft.alternation ?? ""}
            onChange={(event) => setDraft({ ...draft, alternation: (event.target.value || null) as Alternation })}
          >
            <option value="">Нет, каждую неделю</option>
            <option value="first">Да, в 3-ю, 5-ю, 7-ю… неделю</option>
            <option value="second">Да, в 4-ю, 6-ю, 8-ю… неделю</option>
          </NativeSelect>
        </div>
      )}
      <VariantsEditor variants={draft.variants} onChange={(variants) => setDraft({ ...draft, variants })} />
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
                          {item.variants.length > 0 ? ` · вариантов: ${item.variants.length}` : item.body ? "" : " · без текста"}
                          {item.newEachWeek ? " · каждую неделю новый" : ""}
                          {item.alternation ? " · чередуется" : ""}
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
