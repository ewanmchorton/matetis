"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, SearchX } from "lucide-react";

import { BookCover, getBooks } from "@/entities/book";
import { getStatePractices, PracticeCard } from "@/entities/practice";
import { useProgress } from "@/entities/progress";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { EmptyState } from "@/shared/ui/empty-state";
import { Input } from "@/shared/ui/input";
import { PageHeader } from "@/shared/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

export function LibraryPage() {
  const { completedPracticeIds } = useProgress();
  const practices = getStatePractices();
  const books = getBooks();
  const states = useMemo(
    () => Array.from(new Set(practices.map((p) => p.state).filter(Boolean))) as string[],
    [practices],
  );
  const [query, setQuery] = useState("");
  const [state, setState] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const filteredPractices = practices.filter(
    (p) =>
      (!state || p.state === state) &&
      (!q || `${p.title} ${p.summary}`.toLowerCase().includes(q)),
  );
  const filteredBooks = books.filter((b) => !q || b.title.toLowerCase().includes(q));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Библиотека"
        description="Практики под ваше состояние и книги Мастера"
      />

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по библиотеке"
          className="h-11 pl-9"
        />
      </div>

      <Tabs defaultValue="practices">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="practices">Практики по состоянию</TabsTrigger>
          <TabsTrigger value="books">Книги</TabsTrigger>
        </TabsList>

        <TabsContent value="practices" className="space-y-4 pt-4">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {[null, ...states].map((s) => (
              <button
                key={s ?? "all"}
                type="button"
                onClick={() => setState(s)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  state === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card hover:bg-muted",
                )}
              >
                {s ?? "Все"}
              </button>
            ))}
          </div>
          {filteredPractices.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Ничего не нашлось"
              description="Попробуйте другое слово или сбросьте фильтр."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredPractices.map((p) => (
                <PracticeCard
                  key={p.id}
                  practice={p}
                  meta={p.state}
                  done={completedPracticeIds.includes(p.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="books" className="pt-4">
          {filteredBooks.length === 0 ? (
            <EmptyState icon={SearchX} title="Книги не найдены" />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filteredBooks.map((b) => (
                <Link key={b.id} href={routes.book(b.id)} className="group space-y-2">
                  <BookCover book={b} className="transition-transform group-hover:-translate-y-0.5" />
                  <div>
                    <p className="text-sm font-medium leading-snug">{b.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.format} · {b.pages} стр.
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
