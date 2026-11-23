"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { routes } from "@/shared/config/routes";
import { typograph } from "@/shared/lib/typograph";
import { BackButton } from "@/shared/ui/back-button";
import { GlassCard } from "@/shared/ui/glass-card";
import { ScreenLayout } from "@/widgets/screen-layout";

import { useJournal } from "../api/journal-api";
import { journalDate } from "../model/journal";

/** Все записи журнала. Фон тот же, что у профиля. */
export function JournalPage() {
  const router = useRouter();
  const state = useJournal();

  useEffect(() => {
    if (state.status === "signed-out") router.replace(routes.auth);
  }, [state.status, router]);

  return (
    <ScreenLayout
      variant="page"
      background="09_profile"
      title="Журнал"
      clearNav
      actions={<BackButton onClick={() => router.push(routes.profile)} />}
    >
      {state.status === "loading" && <GlassCard aria-hidden className="h-40 animate-pulse" />}
      {state.status === "error" && (
        <GlassCard>
          <p role="alert" className="type-secondary text-destructive">
            {typograph(state.message)}
          </p>
        </GlassCard>
      )}
      {state.status === "ready" && state.notes.length === 0 && (
        <GlassCard>
          <p className="type-secondary text-muted-foreground">Записей пока нет.</p>
        </GlassCard>
      )}
      {state.status === "ready" &&
        state.notes.map((note) => (
          <GlassCard key={`${note.day}-${note.text}`} className="space-y-2">
            <p className="type-caption text-muted-foreground">{journalDate(note.day)}</p>
            <p className="type-body whitespace-pre-wrap text-foreground">{typograph(note.text)}</p>
          </GlassCard>
        ))}
    </ScreenLayout>
  );
}
