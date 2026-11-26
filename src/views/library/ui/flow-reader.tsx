"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

import { openFlowBook, type FlowBook } from "../lib/open-flow";
import { PageZones, type ReaderJump, type ReaderStatus } from "./reader-chrome";
import { type ReaderLook } from "./reader-look";
import { readPlace, writePlace } from "./reader-place";
import { useReaderFrame } from "./reader-mode";

/** Ближайший предок, который реально прокручивается. */
function scrollParent(node: HTMLElement) {
  let current = node.parentElement;
  while (current) {
    const overflow = getComputedStyle(current).overflowY;
    if ((overflow === "auto" || overflow === "scroll") && current.scrollHeight > current.clientHeight + 1) return current;
    current = current.parentElement;
  }
  return null;
}

/** Если глава пришла одним блоком, достаём абзацы. Слишком высокий абзац режем по словам. */
function blocksForPages(host: HTMLElement, limit: number) {
  // Глава часто обёрнута в div. Раскрываем обёртки, иначе весь текст становится одним листом.
  for (let guard = 0; guard < 8; guard += 1) {
    const containers = [...host.children].filter(
      (node): node is HTMLElement =>
        node instanceof HTMLElement &&
        /^(DIV|SECTION|SPAN|ARTICLE)$/.test(node.tagName) &&
        Boolean(node.querySelector("p, div, h1, h2, h3, blockquote, li, section, img")),
    );
    if (!containers.length) break;
    for (const node of containers) node.replaceWith(...node.childNodes);
  }
  for (const node of [...host.childNodes]) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      const paragraph = document.createElement("p");
      paragraph.textContent = node.textContent;
      node.replaceWith(paragraph);
    }
  }
  const ready: HTMLElement[] = [];
  for (const node of [...host.children]) {
    if (!(node instanceof HTMLElement)) continue;
    if (node.offsetHeight <= limit || node.querySelector("img")) {
      ready.push(node);
      continue;
    }
    const text = node.innerText.replace(/\s+/g, " ").trim();
    if (text.length < 240) {
      ready.push(node);
      continue;
    }
    const parts: HTMLElement[] = [];
    let index = 0;
    while (index < text.length) {
      let end = Math.min(text.length, index + 700);
      if (end < text.length) {
        const space = text.lastIndexOf(" ", end);
        if (space > index + 200) end = space;
      }
      const paragraph = document.createElement("p");
      paragraph.textContent = text.slice(index, end).trim();
      parts.push(paragraph);
      index = end;
    }
    node.replaceWith(...parts);
    ready.push(...parts);
  }
  return ready;
}

function packPages(nodes: HTMLElement[], limit: number) {
  const pages: HTMLElement[][] = [];
  let bucket: HTMLElement[] = [];
  let used = 0;
  for (const node of nodes) {
    const height = (node.offsetHeight || 24) + 14;
    if (bucket.length > 0 && used + height > limit) {
      pages.push(bucket);
      bucket = [];
      used = 0;
    }
    bucket.push(node);
    used += height;
  }
  if (bucket.length || pages.length === 0) pages.push(bucket);
  return pages;
}

/** EPUB и FB2: текст подстраивается под ширину экрана. */
export function FlowReader({
  bookId,
  format,
  data,
  mode,
  look,
  chromeOpen,
  onToggleChrome,
  onStatus,
  jump,
}: {
  bookId: string;
  format: "epub" | "fb2";
  data: ArrayBuffer;
  mode: "page" | "scroll";
  look: ReaderLook;
  chromeOpen: boolean;
  onToggleChrome: () => void;
  onStatus: (status: ReaderStatus) => void;
  jump: ReaderJump | null;
}) {
  const [book, setBook] = useState<FlowBook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sliceIndex, setSliceIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [ready, setReady] = useState(false);
  const [shown, setShown] = useState(2);
  const frame = useRef<HTMLDivElement>(null);
  const measure = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const pages = useRef<HTMLElement[][]>([]);
  const pendingEnd = useRef(false);
  const pageRef = useRef(page);
  const startY = useRef(0);
  const enteredScroll = useRef(false);
  const holdSlice = useRef(false);
  const placeRef = useRef({ page, slice: sliceIndex, pageCount });
  const height = useReaderFrame(frame, book !== null);

  // Раньше остальных эффектов: раскладка страниц ниже читает уже новое место.
  useLayoutEffect(() => {
    pageRef.current = page;
    placeRef.current = { page, slice: sliceIndex, pageCount };
  });

  useEffect(() => {
    let revoke = () => undefined as void;
    try {
      const opened = openFlowBook(format, data);
      revoke = opened.revoke;
      if (!opened.slices.length) {
        // Книга разбирается прямо из файла, без ожидания: состояние ставится сразу.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setError("В файле не нашлось текста.");
      } else {
        const saved = readPlace(bookId);
        const slice = Math.min(saved.slice, opened.slices.length - 1);
        setBook(opened);
        setSliceIndex(slice);
        setPage(saved.page);
        setShown(Math.min(opened.slices.length, slice + 2));
      }
    } catch {
      setError("Эту книгу не удалось разобрать.");
    }
    setReady(true);
    return () => revoke();
  }, [bookId, data, format]);

  useEffect(() => {
    if (!ready || !book) return;
    writePlace(bookId, { page, slice: sliceIndex });
  }, [ready, book, bookId, page, sliceIndex]);

  useEffect(() => {
    if (!book || !jump) return;
    // Переход по оглавлению или закладке приходит снаружи.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSliceIndex(Math.min(book.slices.length - 1, Math.max(0, jump.slice)));
    setPage(Math.max(1, jump.page));
  }, [book, jump]);

  useEffect(() => {
    if (!book) return;
    const chapters = book.slices.flatMap((slice, index) => {
      const title = slice.title.replace(/, продолжение$/, "");
      if (index > 0 && book.slices[index - 1]?.title.replace(/, продолжение$/, "") === title) return [];
      return [{ title, index }];
    });
    onStatus({
      page,
      pageCount,
      slice: sliceIndex,
      place: `${page} из ${pageCount}`,
      chapters,
    });
  }, [book, page, pageCount, sliceIndex, onStatus]);

  useLayoutEffect(() => {
    if (mode !== "page" || !book) return;
    const host = measure.current;
    const sheet = view.current;
    const slice = book.slices[sliceIndex];
    if (!host || !sheet || !slice) return;
    let cancel = false;
    sheet.replaceChildren();
    host.innerHTML = slice.html;
    host.style.width = `${sheet.clientWidth}px`;

    const show = (packed: HTMLElement[][], index: number) => {
      while (sheet.firstChild) host.appendChild(sheet.firstChild);
      for (const node of packed[index - 1] ?? []) sheet.appendChild(node);
    };
    const layout = () => {
      if (cancel) return;
      const packed = packPages(blocksForPages(host, sheet.clientHeight || height), sheet.clientHeight || height);
      pages.current = packed;
      const nextCount = packed.length;
      const wanted = pendingEnd.current ? nextCount : pageRef.current;
      pendingEnd.current = false;
      const nextPage = Math.min(Math.max(1, wanted), nextCount);
      setPageCount(nextCount);
      setPage(nextPage);
      show(packed, nextPage);
    };

    const images = [...host.querySelectorAll("img")];
    if (images.every((image) => image.complete)) layout();
    else {
      let left = images.length;
      const done = () => {
        left -= 1;
        if (left <= 0) layout();
      };
      for (const image of images) {
        image.addEventListener("load", done, { once: true });
        image.addEventListener("error", done, { once: true });
      }
    }
    return () => {
      cancel = true;
    };
  }, [mode, book, sliceIndex, height, look]);

  useLayoutEffect(() => {
    if (mode !== "page") return;
    const host = measure.current;
    const sheet = view.current;
    const current = pages.current[page - 1];
    if (!host || !sheet || !current) return;
    while (sheet.firstChild) host.appendChild(sheet.firstChild);
    for (const node of current) sheet.appendChild(node);
  }, [mode, page, pageCount, sliceIndex]);

  useEffect(() => {
    if (mode !== "scroll") {
      enteredScroll.current = false;
      holdSlice.current = false;
      return;
    }
    if (enteredScroll.current) return;
    enteredScroll.current = true;
    holdSlice.current = true;
    const { slice, page: savedPage, pageCount: count } = placeRef.current;
    const fraction = count > 1 ? (savedPage - 1) / count : 0;
    setShown((current) => Math.max(current, slice + 1));
    let tries = 0;
    let timer = 0;
    const go = () => {
      const article = document.querySelector<HTMLElement>(`[data-slice="${slice}"]`);
      if (!article || article.offsetHeight < 40) {
        if (tries < 20) {
          tries += 1;
          timer = window.setTimeout(go, 50);
        } else holdSlice.current = false;
        return;
      }
      article.scrollIntoView({ block: "start" });
      const parent = scrollParent(article);
      const extra = article.offsetHeight * fraction;
      if (parent) parent.scrollTop += extra;
      else window.scrollBy(0, extra);
      holdSlice.current = false;
    };
    timer = window.setTimeout(go, 0);
    return () => {
      window.clearTimeout(timer);
      enteredScroll.current = false;
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== "scroll") return;
    const nodes = [...document.querySelectorAll<HTMLElement>("[data-slice]")];
    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const number = Number(best?.target.getAttribute("data-slice"));
        if (Number.isFinite(number) && !holdSlice.current) setSliceIndex(number);
      },
      { threshold: [0.4] },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [mode, shown, book]);

  useEffect(() => {
    if (mode !== "scroll" || !book || shown >= book.slices.length) return;
    const node = document.querySelector("[data-flow-more]");
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown((current) => Math.min(book.slices.length, current + 2));
        }
      },
      { rootMargin: "700px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [mode, shown, book]);

  function go(step: number) {
    if (!book) return;
    if (step > 0 && page >= pageCount) {
      if (sliceIndex < book.slices.length - 1) {
        setSliceIndex((current) => current + 1);
        setPage(1);
      }
      return;
    }
    if (step < 0 && page <= 1) {
      if (sliceIndex > 0) {
        pendingEnd.current = true;
        setSliceIndex((current) => current - 1);
      }
      return;
    }
    setPage((current) => current + step);
  }

  if (error) return <p className="type-secondary text-muted-foreground">{error}</p>;
  if (!book) return <p className="type-secondary text-muted-foreground">Открываем текст…</p>;

  const sheetStyle = {
    "--reader-size": `${look.size}px`,
    "--reader-font": look.font === "cormorant" ? "var(--font-display)" : "var(--font-sans)",
  } as CSSProperties;

  return (
    <div style={sheetStyle}>
      {mode === "page" ? (
        <div ref={frame} className="relative overflow-hidden" style={{ height }}>
          <div ref={measure} aria-hidden className="flow-sheet pointer-events-none invisible absolute top-0 left-0 -z-10 w-full" />
          <div ref={view} className="flow-sheet h-full overflow-auto" />
          <PageZones open={chromeOpen} onToggle={onToggleChrome} onTurn={go} />
        </div>
      ) : (
        <div
          ref={frame}
          className="space-y-8"
          onPointerDown={(event) => {
            startY.current = event.clientY;
          }}
          onClick={(event) => {
            if (Math.abs(event.clientY - startY.current) > 8) return;
            if (event.target instanceof Element && event.target.closest("a")) return;
            onToggleChrome();
          }}
        >
          {book.slices.slice(0, shown).map((item, index) => (
            <article key={`${item.title}-${index}`} data-slice={index} className="flow-sheet">
              {item.html.startsWith("<h2") ? null : <h2>{item.title}</h2>}
              <div dangerouslySetInnerHTML={{ __html: item.html }} />
            </article>
          ))}
          {shown < book.slices.length && <div data-flow-more className="h-8" />}
        </div>
      )}
    </div>
  );
}
