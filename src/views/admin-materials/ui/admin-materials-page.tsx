"use client";

import { useState } from "react";
import { FileVideo, Trash2 } from "lucide-react";

import { ElementBadge, getElement } from "@/entities/element";
import {
  libraryActions,
  libraryKindLabels,
  useLibraryItems,
  type LibraryItem,
  type LibraryItemKind,
} from "@/entities/library";
import { AddMaterialForm } from "@/features/manage-library";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

const filters: { value: LibraryItemKind | "all"; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "video", label: "Видео" },
  { value: "meditation", label: "Медитации" },
  { value: "book", label: "Книги" },
  { value: "film", label: "Фильмы" },
];

function details(item: LibraryItem): string {
  if (item.kind === "book") return item.author ?? "—";
  if (item.kind === "film") return item.year ? String(item.year) : "—";
  return item.duration ?? "—";
}

export function AdminMaterialsPage() {
  const items = useLibraryItems();
  const [filter, setFilter] = useState<LibraryItemKind | "all">("all");
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const visible = filter === "all" ? items : items.filter((i) => i.kind === filter);

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Материалы библиотеки</h1>
        <p className="text-sm text-muted-foreground">
          Всё, что добавлено здесь, сразу появляется в разделе «Библиотека» в приложении.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4 rounded-2xl border bg-background p-5">
          <div className="flex flex-wrap gap-1">
            {filters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm transition-colors",
                  filter === f.value
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Стихия</TableHead>
                <TableHead>Детали</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((item) => (
                <TableRow
                  key={item.id}
                  className={cn(item.id === lastAddedId && "bg-primary/5")}
                >
                  <TableCell className="max-w-[320px] whitespace-normal">
                    <p className="font-medium">{item.title}</p>
                    {item.fileName && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <FileVideo className="size-3.5" />
                        {item.fileName}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{libraryKindLabels[item.kind]}</TableCell>
                  <TableCell>
                    {item.elementId ? (
                      <ElementBadge element={getElement(item.elementId)} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{details(item)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Удалить «${item.title}»`}
                      onClick={() => libraryActions.remove(item.id)}
                    >
                      <Trash2 className="text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Пока ничего нет
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </section>

        <AddMaterialForm onAdded={(item) => setLastAddedId(item.id)} />
      </div>
    </>
  );
}
