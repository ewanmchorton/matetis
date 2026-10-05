"use client";

import { useState } from "react";

import { getPersonTypeByCode } from "@/entities/person-type";
import { getTypeTest, type TypeTest } from "@/entities/type-test";
import { PageHeader } from "@/shared/ui/page-header";
import { Textarea } from "@/shared/ui/textarea";

export function AdminTestPage() {
  const [test, setTest] = useState<TypeTest>(getTypeTest);
  const [g1, g2] = test.groups;

  const updateSection = (groupId: string, sectionId: string, text: string) =>
    setTest({
      ...test,
      groups: test.groups.map((g) =>
        g.id === groupId
          ? { ...g, sections: g.sections.map((s) => (s.id === sectionId ? { ...s, text } : s)) }
          : g,
      ),
    });

  return (
    <>
      <PageHeader
        title="Тест на определение типа"
        description="Ученик выбирает по одному разделу в каждой группе. Тип = буква из группы 1 + цифра из группы 2."
      />

      <section className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
        <h2 className="font-semibold">Как ответы превращаются в тип</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left font-medium text-muted-foreground">Группа 1 \ Группа 2</th>
                {g2.sections.map((s) => (
                  <th key={s.id} className="p-2 text-left font-medium">
                    {s.code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {g1.sections.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-2 font-medium">{a.code}</td>
                  {g2.sections.map((b) => {
                    const type = getPersonTypeByCode(`${a.code}${b.code}`);
                    return (
                      <td key={b.id} className="p-2">
                        <span className="text-xs text-muted-foreground">{a.code}{b.code}</span>{" "}
                        {type?.name ?? <span className="text-destructive">нет типа</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <details className="rounded-xl border bg-card p-4 text-sm sm:p-5">
        <summary className="cursor-pointer font-semibold">Инструкция для ученика</summary>
        <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground">
          {test.instruction.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
      </details>

      {test.groups.map((g) => (
        <section key={g.id} className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">{g.title}</h2>
            <p className="text-sm text-muted-foreground">{g.hint}</p>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {g.sections.map((s) => (
              <div key={s.id} className="space-y-2 rounded-xl border bg-card p-4">
                <span className="inline-grid size-7 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {s.code}
                </span>
                <Textarea
                  rows={7}
                  value={s.text}
                  onChange={(e) => updateSection(g.id, s.id, e.target.value)}
                  aria-label={`${g.title}, раздел ${s.code}`}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
