"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { getPersonType } from "@/entities/person-type";
import { getTestQuestions, type TestQuestion } from "@/entities/type-test";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { PageHeader } from "@/shared/ui/page-header";

export function AdminTestPage() {
  const [questions, setQuestions] = useState<TestQuestion[]>(getTestQuestions);

  const updateQuestion = (id: string, text: string) =>
    setQuestions(questions.map((q) => (q.id === id ? { ...q, text } : q)));

  const updateOption = (qid: string, oid: string, text: string) =>
    setQuestions(
      questions.map((q) =>
        q.id === qid
          ? { ...q, options: q.options.map((o) => (o.id === oid ? { ...o, text } : o)) }
          : q,
      ),
    );

  const addQuestion = () => {
    const id = `q${Date.now()}`;
    setQuestions([
      ...questions,
      {
        id,
        text: "Новый вопрос",
        options: ["А", "Б"].map((l) => ({ id: `${id}${l}`, text: `Вариант ${l}`, typeIds: [] })),
      },
    ]);
  };

  return (
    <>
      <PageHeader
        title="Тест на определение типа"
        description="Каждый ответ добавляет баллы выбранным типам. Правило подсчёта уточняется у Мастера."
        actions={
          <Button onClick={addQuestion}>
            <Plus /> Добавить вопрос
          </Button>
        }
      />
      <ol className="space-y-4">
        {questions.map((q, i) => (
          <li key={q.id} className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-sm font-medium">
                {i + 1}
              </span>
              <Input
                value={q.text}
                onChange={(e) => updateQuestion(q.id, e.target.value)}
                className="font-medium"
                aria-label={`Текст вопроса ${i + 1}`}
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Удалить вопрос"
                onClick={() => setQuestions(questions.filter((x) => x.id !== q.id))}
              >
                <Trash2 />
              </Button>
            </div>
            <div className="grid gap-2 pl-9">
              {q.options.map((o) => (
                <div key={o.id} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                  <Input
                    value={o.text}
                    onChange={(e) => updateOption(q.id, o.id, e.target.value)}
                    className="sm:max-w-xs"
                    aria-label="Вариант ответа"
                  />
                  <div className="flex flex-wrap gap-1">
                    {o.typeIds.length === 0 ? (
                      <span className="text-xs text-muted-foreground">типы не выбраны</span>
                    ) : (
                      o.typeIds.map((t) => (
                        <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                          {getPersonType(t)?.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
