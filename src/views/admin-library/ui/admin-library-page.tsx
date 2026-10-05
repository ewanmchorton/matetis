"use client";

import { useState } from "react";
import { Download, Lock, Upload } from "lucide-react";

import { BookCover, getBooks, type Book } from "@/entities/book";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PageHeader } from "@/shared/ui/page-header";

export function AdminLibraryPage() {
  const [books, setBooks] = useState<Book[]>(getBooks);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [downloadable, setDownloadable] = useState(true);

  const add = () => {
    setBooks([
      ...books,
      {
        id: `new-${Date.now()}`,
        title: title || "Новая книга",
        author: "Мастер",
        format: "PDF",
        pages: 1,
        downloadable,
        cover: "from-violet-200 to-fuchsia-400",
      },
    ]);
    setTitle("");
    setOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Библиотека и книги"
        description="Сканы книг для чтения в приложении. Практики по состоянию — в разделе «Практики»."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Upload /> Загрузить книгу
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {books.map((b) => (
          <div key={b.id} className="space-y-2">
            <BookCover book={b} />
            <p className="text-sm font-medium leading-snug">{b.title}</p>
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              {b.downloadable ? <Download className="size-3.5" /> : <Lock className="size-3.5" />}
              {b.downloadable ? "можно скачать" : "только чтение"}
            </p>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Загрузить книгу</DialogTitle>
            <DialogDescription>PDF или набор сканов страниц.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="b-title">Название</Label>
              <Input id="b-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              <Upload className="size-5" />
              Выберите файл (загрузка появится в рабочей версии)
            </div>
            <Label className="flex items-center gap-2 font-normal">
              <Checkbox checked={downloadable} onCheckedChange={(v) => setDownloadable(v === true)} />
              Разрешить скачивание
            </Label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button onClick={add}>Добавить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
