"use client";

import { useState } from "react";

import { ElementBadge, getElements, type ElementId } from "@/entities/element";
import { getPersonTypes } from "@/entities/person-type";
import { getProgram } from "@/entities/practice";
import { cn } from "@/shared/lib/utils";
import { PageHeader } from "@/shared/ui/page-header";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/ui/sheet";

type Cell = { typeId: string; elementId: ElementId };

export function AdminProgramsPage() {
  const types = getPersonTypes();
  const elements = getElements();
  const [cell, setCell] = useState<Cell | null>(null);

  const selected = cell ? getProgram(cell.typeId, cell.elementId) : null;
  const selectedType = types.find((t) => t.id === cell?.typeId);
  const selectedElement = elements.find((e) => e.id === cell?.elementId);

  return (
    <>
      <PageHeader
        title="Программы «тип × стихия»"
        description="Нажмите на ячейку, чтобы посмотреть состав программы. В ячейке — число практик и ритуалов."
      />
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-left font-medium text-muted-foreground">Тип</th>
              {elements.map((el) => (
                <th key={el.id} className="p-3 text-left font-medium">
                  <ElementBadge element={el} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {types.map((t) => (
              <tr key={t.id} className="border-b last:border-0">
                <td className="p-3 whitespace-nowrap">
                  <span className="text-muted-foreground">{t.number}.</span> {t.name}
                </td>
                {elements.map((el) => {
                  const p = getProgram(t.id, el.id);
                  const empty = p.daily.length + p.rituals.length === 0;
                  return (
                    <td key={el.id} className="p-1.5">
                      <button
                        type="button"
                        onClick={() => setCell({ typeId: t.id, elementId: el.id })}
                        className={cn(
                          "w-full rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted",
                          empty ? "text-muted-foreground/60" : "bg-primary/5",
                        )}
                      >
                        {empty ? "не заполнено" : `${p.daily.length} + ${p.rituals.length}`}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet open={cell !== null} onOpenChange={(open) => !open && setCell(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {selectedType?.name} · {selectedElement?.name}
            </SheetTitle>
            <SheetDescription>Состав программы для этой связки</SheetDescription>
          </SheetHeader>
          <div className="space-y-6 px-4 pb-6">
            {selected && selected.daily.length + selected.rituals.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Для этой стихии программа ещё не наполнена. По плану контент добавляется в
                течение года.
              </p>
            ) : (
              <>
                <section className="space-y-2">
                  <h3 className="text-sm font-medium">Ежедневные практики ({selected?.daily.length})</h3>
                  <ol className="space-y-1.5 text-sm">
                    {selected?.daily.map((p, i) => (
                      <li key={p.id} className="rounded-lg border px-3 py-2">
                        <span className="text-muted-foreground">День {i + 1}.</span> {p.title}
                      </li>
                    ))}
                  </ol>
                </section>
                <section className="space-y-2">
                  <h3 className="text-sm font-medium">Еженедельные ритуалы ({selected?.rituals.length})</h3>
                  <ul className="space-y-1.5 text-sm">
                    {selected?.rituals.map((p) => (
                      <li key={p.id} className="rounded-lg border px-3 py-2">
                        {p.title} <span className="text-muted-foreground">· {p.weekday}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
