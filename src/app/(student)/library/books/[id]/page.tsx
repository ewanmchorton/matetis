import { notFound } from "next/navigation";

import { getBook, getBooks } from "@/entities/book";
import { BookReaderPage } from "@/views/book-reader";

export function generateStaticParams() {
  return getBooks().map((b) => ({ id: b.id }));
}

export default async function Page({ params }: PageProps<"/library/books/[id]">) {
  const { id } = await params;
  const book = getBook(id);
  if (!book) notFound();
  return <BookReaderPage book={book} />;
}
