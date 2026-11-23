"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { routes } from "@/shared/config/routes";
import { typograph } from "@/shared/lib/typograph";
import { GlassCard } from "@/shared/ui/glass-card";

import type { JournalState } from "../api/journal-api";
import { journalDate } from "../model/journal";

/** Сколько записей видно в профиле. Остальные – на экране «Все записи». */
const previewCount = 3;

/** Журнал в профиле: три последние заметки и переход ко всем. */
export function ProfileJournal({ state }: { state: JournalState }) {
  if (state.status === "loading") return <GlassCard aria-hidden className="h-40 animate-pulse" />;
  if (state.status === "error") {
    return (
      <GlassCard>
        <p role="alert" className="type-secondary text-destructive">
          {typograph(state.message)}
        </p>
      </GlassCard>
    );
  }
  if (state.status !== "ready") return null;
  const preview = state.notes.slice(0, previewCount);

  return (
    <section className="space-y-3" aria-label="Журнал">
      <h2 className="type-section text-foreground">Журнал</h2>
      <GlassCard className="divide-y divide-foreground/10 p-0">
        {preview.length === 0 ? (
          <p className="px-5 py-4 type-secondary text-muted-foreground">Записей пока нет.</p>
        ) : (
          preview.map((note) => (
            <JournalRow key={`${note.day}-${note.text}`} note={note} />
          ))
        )}
        {state.notes.length > 0 && (
          <Link href={routes.journal} className="flex min-h-14 w-full items-center gap-3 px-5 py-3 text-left">
            <span className="min-w-0 flex-1 type-block text-primary">Все записи</span>
            <ChevronRight className="size-5 shrink-0 text-primary" aria-hidden />
          </Link>
        )}
      </GlassCard>
    </section>
  );
}

function JournalRow({ note }: { note: { day: string; text: string } }) {
  return (
    <Link href={routes.journal} className="flex min-h-14 w-full items-center gap-3 px-5 py-3 text-left">
      <span className="min-w-0 flex-1">
        <span className="block type-caption text-muted-foreground">{journalDate(note.day)}</span>
        <span className="block truncate type-secondary text-foreground">{typograph(note.text)}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}
