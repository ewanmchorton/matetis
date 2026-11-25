"use client";

import { ChevronDown, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { getElements, type ElementId } from "@/entities/element";
import { getPersonTypes } from "@/entities/person-type";
import { request } from "@/shared/api/request";
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
  hint: string;
};

const weeklySections: Section[] = [
  {
    title: "Медитация на качество силы",
    frequency: "weekly",
    groupBy: "type",
    alternation: "first",
    opensOnDay: 1,
    hint: "Своя очередь у каждого типа. Пустые недели – на всю стихию, потом её сменяет медитация на слабую.",
  },
  {
    title: "Медитация на слабую стихию",
    frequency: "weekly",
    groupBy: "weak",
    alternation: "second",
    opensOnDay: 8,
    hint: "Очередь по слабой стихии человека. Сменяет медитацию на качество силы, вместе их нет.",
  },
  {
    title: "Прогулка без телефона",
    frequency: "weekly",
    groupBy: "type",
    alternation: null,
    opensOnDay: 15,
    hint: "Своя очередь у каждого типа. Обычно одна неделя, потом следующий вопрос.",
  },
  {
    title: "Полный цикл зарядки",
    frequency: "weekly",
    groupBy: "season",
    alternation: null,
    opensOnDay: 1,
    hint: "По стихии года: одна и та же для всех, пока идёт эта стихия.",
  },
];

const awarenessSections: Section[] = [
  {
    title: "Осознание по книге «2 жизни»",
    frequency: "awareness",
    groupBy: "type",
    alternation: null,
    opensOnDay: 1,
    hint: "Своя очередь у каждого типа. На экране одно осознание.",
  },
  {
    title: "Осознание на слабую стихию",
    frequency: "awareness",
    groupBy: "weak",
    alternation: null,
    opensOnDay: 8,
    hint: "По слабой стихии. Сменяет осознание по книге, вместе их нет.",
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
  const [practices, setPractices] = useState<Practice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState(sections[0].title);
  const [openBucket, setOpenBucket] = useState<string | null>(frequency === "weekly" ? "t1" : "t1");
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const load = useCallback(() => {
    request<Practice[]>("/api/admin/practices")
      .then((rows) => setPractices(rows.filter((row) => row.frequency === frequency)))
      .catch((loadError: Error) => setError(loadError.message));
  }, [frequency]);

  useEffect(load, [load]);

  function practiceOf(section: Section) {
    return practices?.find((item) => item.title === section.title) ?? null;
  }

  async function saveItem(section: Section, bucketId: string, event: FormEvent<HTMLFormElement>, variantId?: string) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError(null);
    const practice = practiceOf(section);
    const variant = {
      id: variantId,
      body: String(data.get("body") ?? ""),
      videoUrl: String(data.get("video") ?? ""),
      spanWeeks: weeksOrNull(String(data.get("weeks") ?? "")),
      typeIds: section.groupBy === "type" ? [bucketId] : [],
      weakElement: section.groupBy === "weak" ? bucketId : null,
      seasonElement: section.groupBy === "season" ? bucketId : null,
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
          key: bucketId,
          ...variant,
        }),
      });
      setOpenItem(null);
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

  if (!practices) return <p className="text-sm text-muted-foreground">Загружаем…</p>;

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Типы и стихии всегда в списке, даже пустые: раздел наполняется, когда появляется текст. Порядок – место в этой
        очереди. Строку можно перетащить за значок слева.
      </p>
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
                <span className="block text-sm text-muted-foreground">{section.hint}</span>
              </span>
              <ChevronDown className={cn("size-4 text-muted-foreground", open && "rotate-180")} />
            </button>
            {open && (
              <div className="space-y-2 border-t px-3 py-3">
                {buckets(section).map((bucket) => {
                  const items = (practice?.variants ?? [])
                    .filter((variant) => inBucket(section, variant, bucket.id))
                    .sort((a, b) => a.position - b.position);
                  const bucketOpen = openBucket === `${section.title}:${bucket.id}`;
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
                          <ItemForm
                            order={items.length + 1}
                            onSubmit={(event) => void saveItem(section, bucket.id, event)}
                          />
                          {items.length === 0 && <p className="text-sm text-muted-foreground">Пока пусто. Раздел на месте.</p>}
                          {items.map((item, index) => (
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
                                  <span className="text-sm">{item.body || "Без текста"}</span>
                                  <span className="mt-0.5 block text-xs text-muted-foreground">
                                    {item.spanWeeks ? `${item.spanWeeks} нед.` : "на всю стихию"}
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
                                  order={index + 1}
                                  body={item.body}
                                  weeks={item.spanWeeks}
                                  video={item.videoUrl}
                                  onSubmit={(event) => void saveItem(section, bucket.id, event, item.id)}
                                />
                              )}
                            </div>
                          ))}
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
  order,
  body = "",
  weeks = null,
  video = "",
  onSubmit,
}: {
  order: number;
  body?: string;
  weeks?: number | null;
  video?: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="space-y-3 rounded-xl border bg-background p-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
        <div className="space-y-1.5">
          <Label htmlFor={`weeks-${order}-${body.slice(0, 8)}`}>Сколько недель</Label>
          <Input
            id={`weeks-${order}-${body.slice(0, 8)}`}
            name="weeks"
            type="number"
            min={1}
            className="h-11"
            placeholder="На всю стихию"
            defaultValue={weeks ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`order-${order}-${body.slice(0, 8)}`}>Порядок</Label>
          <Input
            id={`order-${order}-${body.slice(0, 8)}`}
            name="order"
            type="number"
            min={1}
            className="h-11"
            defaultValue={order}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Текст</Label>
        <Textarea name="body" className="min-h-24" defaultValue={body} required />
      </div>
      <div className="space-y-1.5">
        <Label>Видео – ссылка на YouTube</Label>
        <Input name="video" className="h-11" placeholder="https://youtu.be/…" defaultValue={video ?? ""} />
      </div>
      <Button type="submit" className="h-11">
        Сохранить
      </Button>
    </form>
  );
}
