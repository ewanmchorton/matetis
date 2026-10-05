"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Lock } from "lucide-react";

import type { Book } from "@/entities/book";
import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";

export function BookReaderPage({ book }: { book: Book }) {
  const [page, setPage] = useState(1);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={routes.library.books}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Книги
        </Link>
        {book.downloadable ? (
          <Button variant="outline">
            <Download />
            Скачать {book.format}
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" />
            Только чтение в приложении
          </span>
        )}
      </div>

      <div>
        <h1 className="text-xl font-semibold">{book.title}</h1>
        <p className="text-sm text-muted-foreground">{book.author}</p>
      </div>

      <div className="mx-auto aspect-[3/4] w-full max-w-xl rounded-lg border bg-[#fbf8f1] p-8 shadow-sm sm:p-12 dark:bg-stone-900">
        <div className="flex h-full flex-col gap-3">
          <div className="h-3 w-1/3 rounded bg-stone-300/70" />
          {Array.from({ length: 14 }, (_, i) => (
            <div
              key={i}
              className="h-2 rounded bg-stone-200 dark:bg-stone-700"
              style={{ width: `${70 + ((i * 37 + page * 11) % 30)}%` }}
            />
          ))}
          <p className="mt-auto text-center text-xs text-stone-400">
            Здесь будет страница {page} из скана книги
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon-lg"
          aria-label="Предыдущая страница"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeft />
        </Button>
        <span className="text-sm tabular-nums text-muted-foreground">
          {page} / {book.pages}
        </span>
        <Button
          variant="outline"
          size="icon-lg"
          aria-label="Следующая страница"
          disabled={page === book.pages}
          onClick={() => setPage(page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
