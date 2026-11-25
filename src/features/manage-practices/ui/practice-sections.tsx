"use client";

import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { getElements, type ElementId } from "@/entities/element";
import { getPersonTypes } from "@/entities/person-type";
import { request } from "@/shared/api/request";
import { isStaticPrototype } from "@/shared/config/env";
import { previewSectionPractices } from "@/shared/demo/admin-preview";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

type GroupBy = "type" | "weak" | "season";
type Frequency = "weekly" | "awareness";

type Variant = {
  id: string;
  position: number;
  title: string | null;
  body: string;
  videoUrl: string | null;
  typeIds: string[];
  weakElement: ElementId | null;
  seasonElement: ElementId | null;
  spanWeeks: number | null;
};

type Practice = {
  id: string;
  title: string;
  frequency: Frequency;
  variants: Variant[];
};

type Section = {
  title: string;
  frequency: Frequency;
  groupBy: GroupBy;
  alternation: "first" | "second" | null;
  opensOnDay: number;
  addLabel: string;
  /** Пусто – поле «Сколько недель» есть. У зарядки его нет: одна на всю стихию. */
  showWeeks?: boolean;
};

const weeklySections: Section[] = [
  {
    title: "Медитация на качество силы",
    frequency: "weekly",
    groupBy: "type",
    alternation: "first",
    opensOnDay: 1,
    addLabel: "Добавить медитацию",
  },
  {
    title: "Медитация на слабую стихию",
    frequency: "weekly",
    groupBy: "weak",
    alternation: "second",
    opensOnDay: 8,
    addLabel: "Добавить медитацию",
  },
  {
    title: "Прогулка без телефона",
    frequency: "weekly",
    groupBy: "type",
    alternation: null,
    opensOnDay: 15,
    addLabel: "Добавить вопрос",
  },
  {
    title: "Полный цикл зарядки",
    frequency: "weekly",
    groupBy: "season",
    alternation: null,
    opensOnDay: 1,
    addLabel: "Добавить зарядку",
    showWeeks: false,
  },
];

const awarenessSections: Section[] = [
  {
    title: "Осознание по книге «2 жизни»",
    frequency: "awareness",
    groupBy: "type",
    alternation: null,
    opensOnDay: 1,
    addLabel: "Добавить осознание",
  },
  {
    title: "Осознание на слабую стихию",
    frequency: "awareness",
    groupBy: "weak",
    alternation: null,
    opensOnDay: 8,
    addLabel: "Добавить осознание",
  },
];

const types = getPersonTypes();
const elements = getElements();

function buckets(section: Section) {
  return section.groupBy === "type" ? types.map((type) => ({ id: type.id, name: type.name })) : elements.map((element) => ({ id: element.id, name: element.name }));
}

function inBucket(section: Section, variant: Variant, bucketId: string) {
  if (section.groupBy === "weak") return variant.weakElement === bucketId;
  if (section.groupBy === "season") return variant.seasonElement === bucketId;
  return variant.typeIds[0] === bucketId;
}

function weeksOrNull(value: string) {
  if (!value.trim()) return null;
  const weeks = Number(value);
  return Number.isInteger(weeks) && weeks >= 1 ? weeks : null;
}

/** Разделы практик на стихию и осознаний: внутри – очереди по типам или стихиям. */
export function PracticeSections({ frequency }: { frequency: Frequency }) {
  const sections = frequency === "weekly" ? weeklySections : awarenessSections;
  const [practices, setPractices] = useState<Practice[] | null>(
    isStaticPrototype ? previewSectionPractices().filter((row) => row.frequency === frequency) : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState(sections[0].title);
  const [openBucket, setOpenBucket] = useState<string | null>(frequency === "weekly" ? "t1" : "t1");
  const [openItem, setOpenItem] = useState<string | null>(
    isStaticPrototype ? (frequency === "weekly" ? "meditation-healer" : "awareness-healer") : null,
  );
  const [adding, setAdding] = useState<{ section: string; bucketId: string | null } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (isStaticPrototype) return;
    request<Practice[]>("/api/admin/practices")
      .then((rows) => setPractices(rows.filter((row) => row.frequency === frequency)))
      .catch((loadError: Error) => setError(loadError.message));
  }, [frequency]);

  useEffect(load, [load]);

  function practiceOf(section: Section) {
    return practices?.find((item) => item.title === section.title) ?? null;
  }

  async function saveItem(section: Section, bucketId: string | null, event: FormEvent<HTMLFormElement>, variantId?: string) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const key = bucketId ?? String(data.get("bucket") ?? "");
    setError(null);
    const practice = practiceOf(section);
    const variant = {
      id: variantId,
      title: String(data.get("title") ?? ""),
      body: String(data.get("body") ?? ""),
      videoUrl: String(data.get("video") ?? ""),
      spanWeeks: section.showWeeks === false ? null : weeksOrNull(String(data.get("weeks") ?? "")),
      typeIds: section.groupBy === "type" ? [key] : [],
      weakElement: section.groupBy === "weak" ? key : null,
      seasonElement: section.groupBy === "season" ? key : null,
      order: Number(data.get("order")) || 1,
    };
    try {
      await request("/api/admin/practices/variants", {
        method: "POST",
        body: JSON.stringify({
          practiceId: practice?.id,
          practice: practice
            ? undefined
            : {
                title: section.title,
                frequency: section.frequency,
                alternation: section.alternation,
                opensOnDay: section.opensOnDay,
              },
          groupBy: section.groupBy,
          key,
          ...variant,
        }),
      });
      setOpenItem(null);
      setAdding(null);
      load();
    } catch (saveError) {
      setError((saveError as Error).message);
    }
  }

  async function removeItem(variant: Variant) {
    if (!window.confirm("Удалить эту запись?")) return;
    try {
      await request("/api/admin/practices/variants", { method: "DELETE", body: JSON.stringify({ id: variant.id }) });
      load();
    } catch (removeError) {
      setError((removeError as Error).message);
    }
  }

  async function dropOn(section: Section, bucketId: string, targetId: string) {
    const practice = practiceOf(section);
    if (!practice || !dragId || dragId === targetId) return;
    const items = practice.variants.filter((variant) => inBucket(section, variant, bucketId)).sort((a, b) => a.position - b.position);
    const from = items.findIndex((item) => item.id === dragId);
    const to = items.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    setDragId(null);
    try {
      await request("/api/admin/practices/variants", {
        method: "PUT",
        body: JSON.stringify({ practiceId: practice.id, ids: items.map((item) => item.id) }),
      });
      load();
    } catch (dropError) {
      setError((dropError as Error).message);
    }
  }

  if (!practices) {
    return error ? (
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    ) : (
      <p className="text-sm text-muted-foreground">Загружаем…</p>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {sections.map((section) => {
        const open = openSection === section.title;
        const practice = practiceOf(section);
        return (
          <section key={section.title} className="overflow-hidden rounded-2xl border bg-background">
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
              aria-expanded={open}
              onClick={() => setOpenSection(open ? "" : section.title)}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{section.title}</span>
              </span>
              <ChevronDown className={cn("size-4 text-muted-foreground", open && "rotate-180")} />
            </button>
            {open && (
              <div className="space-y-2 border-t px-3 py-3">
                <div className="sticky top-0 z-10 bg-background py-1">
                  {adding?.section === section.title && adding.bucketId === null ? (
                    <ItemForm
                      formKey={`${section.title}-new`}
                      order={(practice?.variants.length ?? 0) + 1}
                      buckets={buckets(section)}
                      chooseLabel={section.groupBy === "type" ? "Тип" : section.groupBy === "weak" ? "Слабая стихия" : "Стихия года"}
                      submitLabel={section.addLabel}
                      hideWeeks={section.showWeeks === false}
                      onSubmit={(event) => void saveItem(section, null, event)}
                    />
                  ) : (
                    <Button
                      variant="outline"
                      className="h-11"
                      onClick={() => setAdding({ section: section.title, bucketId: null })}
                    >
                      <Plus />
                      {section.addLabel}
                    </Button>
                  )}
                </div>
                {buckets(section).map((bucket) => {
                  const items = (practice?.variants ?? [])
                    .filter((variant) => inBucket(section, variant, bucket.id))
                    .sort((a, b) => a.position - b.position);
                  const bucketOpen = openBucket === `${section.title}:${bucket.id}`;
                  const addingHere = adding?.section === section.title && adding.bucketId === bucket.id;
                  return (
                    <section key={bucket.id} className="overflow-hidden rounded-xl border">
                      <button
                        type="button"
                        className="flex min-h-12 w-full items-center gap-3 px-3 text-left"
                        aria-expanded={bucketOpen}
                        onClick={() => setOpenBucket(bucketOpen ? null : `${section.title}:${bucket.id}`)}
                      >
                        <span className="flex-1 font-medium">{bucket.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {items.length ? `${items.length} в очереди` : "пока пусто"}
                        </span>
                        <ChevronDown className={cn("size-4 text-muted-foreground", bucketOpen && "rotate-180")} />
                      </button>
                      {bucketOpen && (
                        <div className="space-y-3 border-t bg-muted/20 p-3">
                          {addingHere ? (
                            <ItemForm
                              formKey={`${section.title}-${bucket.id}`}
                              order={items.length + 1}
                              submitLabel={section.addLabel}
                              hideWeeks={section.showWeeks === false}
                              onSubmit={(event) => void saveItem(section, bucket.id, event)}
                            />
                          ) : (
                            <Button
                              variant="outline"
                              className="h-11"
                              onClick={() => setAdding({ section: section.title, bucketId: bucket.id })}
                            >
                              <Plus />
                              {section.addLabel}
                            </Button>
                          )}
                          {items.length === 0 && <p className="text-sm text-muted-foreground">Пока пусто.</p>}
                          {items.map((item, index) => {
                            const line = item.title?.trim() || item.body.trim() || "Без названия";
                            const note = item.title?.trim() && item.body.trim() && item.body.trim() !== item.title.trim() ? item.body.trim() : "";
                            return (
                              <div key={item.id}>
                                <div
                                  className="flex items-center gap-2"
                                  onDragOver={(event) => event.preventDefault()}
                                  onDrop={() => void dropOn(section, bucket.id, item.id)}
                                >
                                  <span
                                    draggable
                                    title="Перетащить"
                                    className="cursor-grab px-1 text-muted-foreground"
                                    onDragStart={() => setDragId(item.id)}
                                  >
                                    ⋮⋮
                                  </span>
                                  <button
                                    type="button"
                                    className="min-w-0 flex-1 text-left"
                                    onClick={() => setOpenItem(openItem === item.id ? null : item.id)}
                                  >
                                    <span className="text-sm text-muted-foreground">{index + 1}. </span>
                                    <span className="text-sm font-medium">{line}</span>
                                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                      {section.showWeeks === false || !item.spanWeeks ? "на всю стихию" : `${item.spanWeeks} нед.`}
                                      {note ? ` · ${note}` : ""}
                                    </span>
                                  </button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-11"
                                    aria-label="Удалить запись"
                                    onClick={() => void removeItem(item)}
                                  >
                                    <Trash2 />
                                  </Button>
                                </div>
                                {openItem === item.id && (
                                  <ItemForm
                                    formKey={item.id}
                                    order={index + 1}
                                    title={item.title ?? ""}
                                    body={item.body}
                                    weeks={item.spanWeeks}
                                    video={item.videoUrl}
                                    submitLabel="Сохранить"
                                    hideWeeks={section.showWeeks === false}
                                    onSubmit={(event) => void saveItem(section, bucket.id, event, item.id)}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function ItemForm({
  formKey,
  order,
  title = "",
  body = "",
  weeks = null,
  video = "",
  buckets,
  chooseLabel,
  submitLabel,
  hideWeeks = false,
  onSubmit,
}: {
  formKey: string;
  order: number;
  title?: string;
  body?: string;
  weeks?: number | null;
  video?: string | null;
  buckets?: { id: string; name: string }[];
  chooseLabel?: string;
  submitLabel: string;
  hideWeeks?: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="space-y-3 rounded-xl border bg-background p-3" onSubmit={onSubmit}>
      {buckets && (
        <div className="space-y-1.5">
          <Label htmlFor={`bucket-${formKey}`}>{chooseLabel}</Label>
          <select id={`bucket-${formKey}`} name="bucket" required className="h-11 w-full rounded-lg border bg-background px-3 text-sm">
            <option value="">Выберите</option>
            {buckets.map((bucket) => (
              <option key={bucket.id} value={bucket.id}>
                {bucket.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor={`title-${formKey}`}>Название</Label>
        <Input id={`title-${formKey}`} name="title" className="h-11" placeholder="Как увидит человек" defaultValue={title} required />
      </div>
      <div className={hideWeeks ? "space-y-1.5" : "grid gap-3 sm:grid-cols-[1fr_140px]"}>
        {!hideWeeks && (
          <div className="space-y-1.5">
            <Label htmlFor={`weeks-${formKey}`}>Сколько недель</Label>
            <Input
              id={`weeks-${formKey}`}
              name="weeks"
              type="number"
              min={1}
              className="h-11"
              placeholder="На всю стихию"
              defaultValue={weeks ?? ""}
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor={`order-${formKey}`}>Порядок</Label>
          <Input id={`order-${formKey}`} name="order" type="number" min={1} className="h-11" defaultValue={order} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`body-${formKey}`}>Текст</Label>
        <Textarea id={`body-${formKey}`} name="body" className="min-h-24" defaultValue={body} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`video-${formKey}`}>Видео – ссылка на YouTube</Label>
        <Input id={`video-${formKey}`} name="video" className="h-11" placeholder="https://youtu.be/…" defaultValue={video ?? ""} />
      </div>
      <Button type="submit" className="h-11">
        {submitLabel}
      </Button>
    </form>
  );
}
