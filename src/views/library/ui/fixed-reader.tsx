"use client";

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { cancelPdfPage, openDjvu, openPdf, type FixedBook } from "../lib/open-fixed";
import { type ReaderJump, type ReaderStatus } from "./reader-chrome";
import { readPlace, writePlace } from "./reader-place";
import { useReaderFrame } from "./reader-mode";

function PageCanvas({
  book,
  page,
  watch,
  width,
  maxHeight,
}: {
  book: FixedBook;
  page: number;
  watch: boolean;
  width?: number;
  maxHeight?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  // В режиме «по странице» лист рисуется сразу, без ожидания прокрутки.
  const active = !watch || inView;

  useEffect(() => {
    if (!watch) return;
    const node = host.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { rootMargin: "700px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [watch]);

  useEffect(() => {
    const cssWidth = width && width > 20 ? width : (host.current?.clientWidth ?? 0);
    if (!active || !host.current || cssWidth < 20) return;
    const node = document.createElement("canvas");
    node.className = "max-w-none bg-background shadow-[0_2px_12px_rgb(41_44_40/0.06)]";
    host.current.replaceChildren(node);
    let cancel = false;
    void book.render(page, node, cssWidth, maxHeight).catch((reason: unknown) => {
      if (cancel) return;
      const message = reason instanceof Error ? reason.message : "";
      if (/cancel/i.test(message)) return;
      host.current?.setAttribute("data-render-error", message || "Не удалось нарисовать страницу");
    });
    return () => {
      cancel = true;
      cancelPdfPage(node);
    };
  }, [active, book, page, width, maxHeight]);

  return <div ref={host} className="flex min-h-full min-w-full justify-center" />;
}

/** Скан или PDF: одна страница на лист, либо страницы одна под другой. */
export function FixedReader({
  bookId,
  format,
  data,
  mode,
  chromeOpen,
  onToggleChrome,
  onStatus,
  jump,
}: {
  bookId: string;
  format: "pdf" | "djvu";
  data: ArrayBuffer;
  mode: "page" | "scroll";
  chromeOpen: boolean;
  onToggleChrome: () => void;
  onStatus: (status: ReaderStatus) => void;
  jump: ReaderJump | null;
}) {
  const [book, setBook] = useState<FixedBook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [ready, setReady] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const height = useReaderFrame(frame, book !== null);
  const startY = useRef(0);
  const scrolled = useRef(false);
  const holdPage = useRef(false);
  const [zoom, setZoom] = useState(1);
  const [landscape, setLandscape] = useState(false);
  const [frameBox, setFrameBox] = useState({ width: 0, height: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const lastTap = useRef(0);
  const tapTimer = useRef(0);
  const pageRef = useRef(page);

  useLayoutEffect(() => {
    pageRef.current = page;
  });

  useEffect(() => {
    let closed: FixedBook | null = null;
    let cancel = false;
    const saved = readPlace(bookId);
    const open = format === "pdf" ? openPdf(data) : openDjvu(data);
    void open
      .then((opened) => {
        if (cancel) {
          opened.close();
          return;
        }
        closed = opened;
        const start = Math.min(saved.page, opened.pageCount);
        setBook(opened);
        setPage(start);
        setReady(true);
      })
      .catch(() => {
        if (!cancel) setError("Эту книгу не удалось открыть.");
      });
    return () => {
      cancel = true;
      closed?.close();
    };
  }, [bookId, data, format]);

  useEffect(() => {
    if (!ready) return;
    writePlace(bookId, { page, slice: 0 });
  }, [ready, bookId, page]);

  useEffect(() => {
    if (!book || !jump) return;
    // Переход по оглавлению или закладке приходит снаружи.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(Math.min(book.pageCount, Math.max(1, jump.page)));
  }, [book, jump]);

  useEffect(() => {
    if (!book) return;
    onStatus({
      page,
      pageCount: book.pageCount,
      slice: 0,
      place: `${page} из ${book.pageCount}`,
      chapters: [],
    });
  }, [book, page, onStatus]);

  useEffect(() => {
    if (mode !== "scroll") {
      scrolled.current = false;
      holdPage.current = false;
      return;
    }
    if (scrolled.current) return;
    scrolled.current = true;
    holdPage.current = true;
    const target = pageRef.current;
    let tries = 0;
    let timer = 0;
    const go = () => {
      const node = document.querySelector<HTMLElement>(`[data-fixed-page="${target}"]`);
      const canvas = node?.querySelector("canvas");
      if (!node || !canvas || canvas.clientHeight < 20) {
        if (tries < 40) {
          tries += 1;
          timer = window.setTimeout(go, 100);
        } else holdPage.current = false;
        return;
      }
      node.scrollIntoView({ block: "start" });
      holdPage.current = false;
    };
    timer = window.setTimeout(go, 0);
    return () => window.clearTimeout(timer);
  }, [mode]);

  useEffect(() => {
    if (mode !== "scroll" || !book) return;
    const nodes = [...document.querySelectorAll<HTMLElement>("[data-fixed-page]")];
    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const number = Number(best?.target.getAttribute("data-fixed-page"));
        if (number && !holdPage.current) setPage(number);
      },
      { threshold: [0.4] },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [mode, book]);

  useEffect(() => {
    const media = window.matchMedia("(orientation: landscape)");
    const apply = () => setLandscape(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    // Новая страница открывается без увеличения, откуда бы ни пришла смена страницы.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setZoom(1);
  }, [page]);

  useEffect(() => {
    const node = frame.current;
    if (!node || mode !== "page") return;
    const measure = () => setFrameBox({ width: node.clientWidth, height: node.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [mode, book, height, landscape]);

  function pointerDistance() {
    const [first, second] = [...pointers.current.values()];
    if (!first || !second) return 0;
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  function onScanPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) pinch.current = { distance: pointerDistance(), zoom };
  }

  function onScanPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size < 2 || !pinch.current || pinch.current.distance <= 0) return;
    const next = pinch.current.zoom * (pointerDistance() / pinch.current.distance);
    setZoom(Math.min(4, Math.max(1, next)));
  }

  function onScanPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const start = pointers.current.get(event.pointerId);
    pointers.current.delete(event.pointerId);
    if (pinch.current) {
      if (pointers.current.size < 2) pinch.current = null;
      return;
    }
    if (!start) return;
    const deltaX = event.clientX - start.x;
    const moved = Math.hypot(deltaX, event.clientY - start.y);
    if (moved > 48) {
      if (zoom > 1) return;
      if (chromeOpen) onToggleChrome();
      go(deltaX > 0 ? -1 : 1);
      return;
    }
    if (moved > 12) return;
    const now = event.timeStamp;
    window.clearTimeout(tapTimer.current);
    if (now - lastTap.current < 280) {
      lastTap.current = 0;
      setZoom((current) => (current > 1 ? 1 : 2));
      return;
    }
    lastTap.current = now;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    tapTimer.current = window.setTimeout(() => {
      const middle = x > rect.width / 3 && x < (rect.width * 2) / 3;
      if (zoom > 1) {
        if (middle) onToggleChrome();
        return;
      }
      if (chromeOpen || middle) onToggleChrome();
      else go(x < rect.width / 3 ? -1 : 1);
    }, 280);
  }

  function go(step: number) {
    if (!book) return;
    setPage((current) => Math.min(book.pageCount, Math.max(1, current + step)));
  }

  if (error) return <p className="type-secondary text-muted-foreground">{error}</p>;
  if (!book) return <p className="type-secondary text-muted-foreground">Открываем страницы…</p>;

  return (
    <>
      {mode === "page" ? (
        <div
          ref={frame}
          className="relative overflow-auto"
          style={{ height }}
          onPointerDown={onScanPointerDown}
          onPointerMove={onScanPointerMove}
          onPointerUp={onScanPointerUp}
          onPointerCancel={onScanPointerUp}
        >
          <PageCanvas
            book={book}
            page={page}
            watch={false}
            width={frameBox.width > 20 ? frameBox.width * zoom : undefined}
            maxHeight={!landscape && frameBox.height > 20 ? frameBox.height * zoom : undefined}
          />
        </div>
      ) : (
        <div
          ref={frame}
          className="space-y-4"
          onPointerDown={(event) => {
            startY.current = event.clientY;
          }}
          onClick={(event) => {
            if (Math.abs(event.clientY - startY.current) > 8) return;
            onToggleChrome();
          }}
        >
          {Array.from({ length: book.pageCount }, (_, index) => {
            const number = index + 1;
            return (
              <div key={number} data-fixed-page={number}>
                <PageCanvas book={book} page={number} watch />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
