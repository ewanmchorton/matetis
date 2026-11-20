"use client";

import { Bookmark, ChevronLeft, List, SlidersHorizontal } from "lucide-react";
import { useRef, type CSSProperties, type ReactNode } from "react";

import { typograph } from "@/shared/lib/typograph";
import { cn } from "@/shared/lib/utils";
import type { ReaderMark } from "./reader-marks";
import { readerSizes, type ReaderLook } from "./reader-look";

export type ReaderChapter = { title: string; index: number };

export type ReaderStatus = {
  page: number;
  pageCount: number;
  slice: number;
  place: string;
  chapters: ReaderChapter[];
};

export type ReaderJump = { page: number; slice: number; n: number };

/** Левая треть листает назад, правая – вперёд, середина открывает меню. Свайп листает. */
export function PageZones({
  open,
  onToggle,
  onTurn,
}: {
  open: boolean;
  onToggle: () => void;
  onTurn: (step: number) => void;
}) {
  const startX = useRef(0);
  const swiped = useRef(false);

  function tap(part: "prev" | "menu" | "next") {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    if (open || part === "menu") onToggle();
    else onTurn(part === "prev" ? -1 : 1);
  }

  return (
    <div
      className="absolute inset-0 flex"
      onPointerDown={(event) => {
        startX.current = event.clientX;
      }}
      onPointerUp={(event) => {
        const delta = event.clientX - startX.current;
        if (Math.abs(delta) < 48) return;
        swiped.current = true;
        if (open) onToggle();
        onTurn(delta > 0 ? -1 : 1);
      }}
    >
      <button type="button" className="h-full w-1/3" aria-label={open ? "Закрыть меню" : "Предыдущая страница"} onClick={() => tap("prev")} />
      <button type="button" className="h-full w-1/3" aria-label={open ? "Закрыть меню" : "Меню чтения"} onClick={() => tap("menu")} />
      <button type="button" className="h-full w-1/3" aria-label={open ? "Закрыть меню" : "Следующая страница"} onClick={() => tap("next")} />
    </div>
  );
}

function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="type-caption text-muted-foreground">{label}</p>
      <div className="grid rounded-2xl bg-secondary p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={cn(
              "h-11 rounded-xl type-button",
              value === option.value ? "bg-background text-foreground shadow-[0_1px_4px_rgb(41_44_40/0.08)]" : "text-muted-foreground",
            )}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToolButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 type-caption",
        pressed ? "bg-primary/10 text-primary" : "text-foreground",
      )}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {children}
      {label}
    </button>
  );
}

/**
 * Меню читалки. Спрятано, пока человек не нажмёт середину страницы.
 * Снизу – закладка, оглавление, настройки и возврат к списку, как кнопка на экране практики.
 */
export function ReaderChrome({
  title,
  author,
  status,
  textBook,
  mode,
  onMode,
  look,
  onLook,
  marked,
  marks,
  panel,
  onPanel,
  onBack,
  onJump,
  onToggleMark,
  onClose,
}: {
  title: string;
  author: string;
  status: ReaderStatus | null;
  textBook: boolean;
  mode: "page" | "scroll";
  onMode: (mode: "page" | "scroll") => void;
  look: ReaderLook;
  onLook: (look: ReaderLook) => void;
  marked: boolean;
  marks: ReaderMark[];
  panel: "main" | "settings" | "contents";
  onPanel: (panel: "main" | "settings" | "contents") => void;
  onBack: () => void;
  onJump: (target: { page: number; slice: number }) => void;
  onToggleMark: () => void;
  onClose: () => void;
}) {
  const sizeIndex = Math.max(0, readerSizes.indexOf(look.size));
  const currentChapter = status?.chapters.filter((chapter) => chapter.index <= (status?.slice ?? 0)).at(-1);

  return (
    <>
      <button type="button" aria-label="Закрыть меню" className="fixed inset-0 z-20 bg-transparent" onClick={onClose} />
      <div className="fixed inset-x-0 top-[calc(var(--safe-top)+var(--header-top))] z-30 mx-auto flex h-(--header-height) w-full max-w-[440px] items-center gap-3 bg-background/85 px-(--screen-gutter) backdrop-blur-[6px]">
        <button
          type="button"
          aria-label="К списку книг"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-background/85 text-foreground shadow-[0_2px_10px_rgb(41_44_40/0.12)]"
          onClick={onBack}
        >
          <ChevronLeft className="size-6" strokeWidth={1.75} aria-hidden />
        </button>
        <div className="min-w-0">
          <p className="truncate type-block text-foreground">{typograph(title)}</p>
          <p className="truncate type-caption text-muted-foreground">{typograph(author)}</p>
        </div>
      </div>
      <div
        className="fixed inset-x-0 z-30 mx-auto w-full max-w-[440px] px-(--screen-gutter)"
        style={{ bottom: "calc(max(var(--nav-bottom), var(--safe-bottom) - 12px) + var(--nav-height) + 12px)" } as CSSProperties}
      >
        <div className="rounded-3xl border border-white/60 bg-background/90 p-4 shadow-[0_4px_20px_rgb(41_44_40/0.08)] backdrop-blur-[6px]">
          {panel === "main" && (
            <>
              {status && <p className="type-caption text-center text-muted-foreground">{status.place}</p>}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <ToolButton label="Оглавление" onClick={() => onPanel("contents")}>
                  <List className="size-6" strokeWidth={1.75} aria-hidden />
                </ToolButton>
                <ToolButton label="Закладка" pressed={marked} onClick={onToggleMark}>
                  <Bookmark className="size-6" strokeWidth={1.75} fill={marked ? "currentColor" : "none"} aria-hidden />
                </ToolButton>
                <ToolButton label="Настройки" onClick={() => onPanel("settings")}>
                  <SlidersHorizontal className="size-6" strokeWidth={1.75} aria-hidden />
                </ToolButton>
              </div>
            </>
          )}

          {panel === "settings" && (
            <div className="space-y-4">
              {textBook && (
                <>
                  <div className="space-y-2">
                    <p className="type-caption text-muted-foreground">Размер текста</p>
                    <div className="flex items-center rounded-2xl bg-secondary p-1">
                      <button
                        type="button"
                        className="h-11 flex-1 rounded-xl type-button text-foreground disabled:text-muted-foreground"
                        aria-label="Меньше"
                        disabled={sizeIndex <= 0}
                        onClick={() => onLook({ ...look, size: readerSizes[sizeIndex - 1] ?? look.size })}
                      >
                        A−
                      </button>
                      <span className="w-10 text-center type-button text-foreground">{look.size}</span>
                      <button
                        type="button"
                        className="h-11 flex-1 rounded-xl type-button text-foreground disabled:text-muted-foreground"
                        aria-label="Больше"
                        disabled={sizeIndex >= readerSizes.length - 1}
                        onClick={() => onLook({ ...look, size: readerSizes[sizeIndex + 1] ?? look.size })}
                      >
                        A+
                      </button>
                    </div>
                  </div>
                  <Choice
                    label="Шрифт"
                    value={look.font}
                    options={[
                      { value: "manrope", label: "Манропе" },
                      { value: "cormorant", label: "Cormorant" },
                    ]}
                    onChange={(font) => onLook({ ...look, font: font === "cormorant" ? "cormorant" : "manrope" })}
                  />
                </>
              )}
              {!textBook && (
                <p className="type-caption text-muted-foreground">У скана размер и шрифт не меняются: это картинка страницы.</p>
              )}
              <Choice
                label="Режим чтения"
                value={mode}
                options={[
                  { value: "page", label: "Листание" },
                  { value: "scroll", label: "Прокрутка" },
                ]}
                onChange={(next) => onMode(next === "scroll" ? "scroll" : "page")}
              />
            </div>
          )}

          {panel === "contents" && (
            <div className="space-y-3">
              <div className="max-h-64 space-y-1 overflow-auto">
                {marks.length > 0 && (
                  <div className="space-y-1 pb-2">
                    <p className="type-caption text-muted-foreground">Закладки</p>
                    {marks.map((mark) => (
                      <button
                        key={`${mark.slice}-${mark.page}`}
                        type="button"
                        className="block w-full rounded-xl px-3 py-2 text-left type-secondary text-foreground hover:bg-secondary"
                        onClick={() => onJump(mark)}
                      >
                        {textBook ? `Лист ${mark.page}` : `Страница ${mark.page}`}
                      </button>
                    ))}
                  </div>
                )}
                {status && status.chapters.length > 0 ? (
                  status.chapters.map((chapter) => (
                    <button
                      key={`${chapter.index}-${chapter.title}`}
                      type="button"
                      className={cn(
                        "block w-full rounded-xl px-3 py-2 text-left type-secondary",
                        currentChapter?.index === chapter.index ? "bg-secondary text-foreground" : "text-foreground hover:bg-secondary",
                      )}
                      onClick={() => onJump({ page: 1, slice: chapter.index })}
                    >
                      {typograph(chapter.title)}
                    </button>
                  ))
                ) : (
                  <p className="type-secondary text-muted-foreground">
                    В этом скане нет оглавления. Страницы листаются по краям.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
