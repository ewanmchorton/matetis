import { readFile } from "node:fs/promises";
import path from "node:path";

import { bookById, type BookFormat } from "@/entities/library/model/readable-books";

const mime: Record<BookFormat, string> = {
  pdf: "application/pdf",
  djvu: "image/vnd.djvu",
  epub: "application/epub+zip",
  fb2: "application/xml",
};

/** Отдаёт файл книги читалке. Скачивания в интерфейсе нет: файл только для показа страниц. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = bookById(id);
  if (!book) return new Response("Нет такой книги", { status: 404 });

  const root = path.resolve(process.cwd(), "private", "library-books");
  const full = path.resolve(root, book.file);
  if (full !== path.join(root, book.file)) return new Response("Нет такой книги", { status: 404 });

  try {
    const data = await readFile(full);
    return new Response(data, {
      headers: {
        "Content-Type": mime[book.format],
        "Content-Length": String(data.byteLength),
        "Cache-Control": "private, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Файл книги не найден на этом компьютере", { status: 404 });
  }
}
