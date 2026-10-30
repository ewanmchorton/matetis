"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { loadMyProgram } from "@/entities/program";
import type { ProgramPractice } from "@/entities/program/server";
import { request } from "@/shared/api/request";
import { routes } from "@/shared/config/routes";
import { typograph } from "@/shared/lib/typograph";
import { BackButton } from "@/shared/ui/back-button";
import { Button } from "@/shared/ui/button";
import { GlassCard } from "@/shared/ui/glass-card";
import { ScreenLayout } from "@/widgets/screen-layout";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; practice: ProgramPractice };

const daypartNames = { morning: "Утро", evening: "Вечер" } as const;

/** Экран практики с заметками для себя: «Мышление по навигатору дня». */
export function PracticePage({ practiceId }: { practiceId: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "loading" });
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [pending, setPending] = useState(false);
  const notePath = `/api/program/notes/${encodeURIComponent(practiceId)}`;

  useEffect(() => {
    Promise.all([loadMyProgram(), request<{ text: string }>(notePath)])
      .then(([program, saved]) => {
        const practice = [...program.morning, ...program.evening, ...program.weekly].find(
          (item) => item.id === practiceId,
        );
        if (!practice) throw new Error("Практика не найдена");
        setState({ status: "ready", practice });
        setNote(saved.text);
        setSavedNote(saved.text);
      })
      .catch((loadError: Error) => setState({ status: "error", message: loadError.message }));
  }, [notePath, practiceId]);

  const practice = state.status === "ready" ? state.practice : null;

  async function saveNote() {
    if (note.trim() !== savedNote) await request(notePath, { method: "PUT", body: JSON.stringify({ text: note }) });
  }

  async function finish(done: boolean) {
    setPending(true);
    try {
      await saveNote();
      if (done) {
        await request(`/api/program/practices/${encodeURIComponent(practiceId)}`, {
          method: "POST",
          body: JSON.stringify({ done: true }),
        });
      }
      router.push(routes.program);
    } catch (saveError) {
      setState({ status: "error", message: (saveError as Error).message });
      setPending(false);
    }
  }

  return (
    <ScreenLayout
      variant="page"
      background="04_earth_03_lizard"
      beforeTitle={
        practice?.daypart && (
          <p className="type-caption text-muted-foreground">{daypartNames[practice.daypart]} · каждый день</p>
        )
      }
      title={practice?.title ?? "Практика"}
      actions={
        <>
          <BackButton onClick={() => void finish(false)} />
          <Button size="cta" className="flex-1" disabled={pending || !practice} onClick={() => void finish(true)}>
            Выполнено
          </Button>
        </>
      }
    >
      {state.status === "loading" && <GlassCard aria-hidden className="h-40 animate-pulse" />}
      {state.status === "error" && (
        <GlassCard>
          <p role="alert" className="type-secondary text-destructive">
            {typograph(state.message)}
          </p>
        </GlassCard>
      )}
      {practice && (
        <>
          <GlassCard className="space-y-4 bg-background/80">
            {practice.body && <p className="type-body text-foreground">{typograph(practice.body)}</p>}
            <label htmlFor="practice-note" className="block type-secondary text-muted-foreground">
              Заметки для себя
            </label>
          </GlassCard>
          <textarea
            id="practice-note"
            className="min-h-40 w-full resize-none rounded-3xl border border-white/60 bg-background/70 p-5 type-body text-foreground backdrop-blur-[6px] outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            placeholder="Пара строк, если хочется чем-то поделиться"
            maxLength={2000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </>
      )}
    </ScreenLayout>
  );
}
