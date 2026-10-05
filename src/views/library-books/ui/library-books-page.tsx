"use client";

import Link from "next/link";
import { useState } from "react";
import { SearchX } from "lucide-react";

import { BookCover, getBooks } from "@/entities/book";
import { routes } from "@/shared/config/routes";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/ui/page-header";
import { SearchInput } from "@/shared/ui/search-input";

export function LibraryBooksPage() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const books = getBooks().filter((b) => !q || b.title.toLowerCase().includes(q));

  return (
    <div className="space-y-5">
      <PageHeader title="Книги" description="Сканы книг: читать в приложении или скачать" />
      <SearchInput value={query} onChange={setQuery} placeholder="Поиск книг" />
      {books.length === 0 ? (
        <EmptyState icon={SearchX} title="Книги не найдены" />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {books.map((b) => (
            <Link key={b.id} href={routes.library.book(b.id)} className="group space-y-2">
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
    </div>
  );
}
