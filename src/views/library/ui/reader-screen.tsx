"use client";

import { useCallback, useEffect, useState } from "react";

import type { ReadableBook } from "@/entities/library/model/readable-books";
import { isStaticPrototype } from "@/shared/config/env";
import { Button } from "@/shared/ui/button";
import { ScreenLayout } from "@/widgets/screen-layout";

import { FixedReader } from "./fixed-reader";
import { FlowReader } from "./flow-reader";
import { ReaderChrome, type ReaderJump, type ReaderStatus } from "./reader-chrome";
import { readLook, writeLook, type ReaderLook } from "./reader-look";
import { readMarks, sameMark, toggleMark, type ReaderMark } from "./reader-marks";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Читалка без кнопок на странице. Середина листа открывает меню:
 * закладка, оглавление, размер, шрифт, режим и возврат к списку.
 */
export function ReaderScreen({ book, onBack }: { book: ReadableBook; onBack: () => void }) {
  const [data, setData] = useState<ArrayBuffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chrome, setChrome] = useState(false);
  const [panel, setPanel] = useState<"main" | "settings" | "contents">("main");
  const [mode, setMode] = useState<"page" | "scroll">("page");
  const [look, setLook] = useState<ReaderLook>({ size: 17, font: "manrope" });
  const [marks, setMarks] = useState<ReaderMark[]>([]);
  const [status, setStatus] = useState<ReaderStatus | null>(null);
  const [jump, setJump] = useState<ReaderJump | null>(null);
  const textBook = book.format === "epub" || book.format === "fb2";

  useEffect(() => {
    setLook(readLook());
    setMarks(readMarks(book.id));
    setChrome(false);
    setPanel("main");
    setStatus(null);
  }, [book.id]);

  useEffect(() => {
    let cancel = false;
    setData(null);
    setError(null);
    if (!book.published && isStaticPrototype) {
      setData(null);
      setError("На сайте для просмотра пока открывается только «Две жизни».");
      return;
    }
    const url = book.published ? `${basePath}/${book.published}` : `${basePath}/api/library/books/${book.id}`;
    void fetch(url)
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.arrayBuffer();
      })
      .then((buffer) => {
        if (!cancel) setData(buffer);
      })
      .catch(() => {
        if (!cancel) setError("Файл книги не найден на этом компьютере.");
      });
    return () => {
      cancel = true;
    };
  }, [book.id, book.published]);

  const onStatus = useCallback((next: ReaderStatus) => {
    setStatus((current) => {
      if (!current) return next;
      if (
        current.page === next.page &&
        current.pageCount === next.pageCount &&
        current.slice === next.slice &&
        current.place === next.place &&
        current.chapters.length === next.chapters.length
      ) {
        return current;
      }
      return next;
    });
  }, []);

  function changeLook(next: ReaderLook) {
    setLook(next);
    writeLook(next);
  }

  function jumpTo(target: { page: number; slice: number }) {
    setJump({ ...target, n: Date.now() });
    setChrome(false);
    setPanel("main");
  }

  const here = status ? { page: status.page, slice: status.slice } : null;

  return (
    <ScreenLayout variant="page" hideHeading title={book.title}>
      {error && <p className="type-secondary text-muted-foreground">{error}</p>}
      {!data && !error && <p className="type-secondary text-muted-foreground">Открываем книгу…</p>}
      {(error || !data) && (
        <Button variant="outline" size="cta" className="border-white/60 bg-background/80" onClick={onBack}>
          К списку книг
        </Button>
      )}
      {data && (book.format === "pdf" || book.format === "djvu") && (
        <FixedReader
          bookId={book.id}
          format={book.format}
          data={data}
          mode={mode}
          chromeOpen={chrome}
          onToggleChrome={() => {
            setChrome((open) => !open);
            setPanel("main");
          }}
          onStatus={onStatus}
          jump={jump}
        />
      )}
      {data && (book.format === "epub" || book.format === "fb2") && (
        <FlowReader
          bookId={book.id}
          format={book.format}
          data={data}
          mode={mode}
          look={look}
          chromeOpen={chrome}
          onToggleChrome={() => {
            setChrome((open) => !open);
            setPanel("main");
          }}
          onStatus={onStatus}
          jump={jump}
        />
      )}
      {data && chrome && (
        <ReaderChrome
          title={book.title}
          author={book.author}
          status={status}
          textBook={textBook}
          mode={mode}
          onMode={setMode}
          look={look}
          onLook={changeLook}
          marked={Boolean(here && marks.some((mark) => sameMark(mark, here)))}
          marks={marks}
          panel={panel}
          onPanel={setPanel}
          onBack={onBack}
          onJump={jumpTo}
          onClose={() => {
            setChrome(false);
            setPanel("main");
          }}
          onToggleMark={() => {
            if (!here) return;
            setMarks(toggleMark(book.id, here));
          }}
        />
      )}
    </ScreenLayout>
  );
}
