"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

import {
  isAudioPractice,
  isAwarenessPractice,
  isThinkingPractice,
  loadMyProgram,
  numberedSteps,
  rememberedPractice,
} from "@/entities/program";
import type { ProgramPractice } from "@/entities/program/server";
import { request } from "@/shared/api/request";
import { isStaticPrototype } from "@/shared/config/env";
import { routes } from "@/shared/config/routes";
import { typograph } from "@/shared/lib/typograph";
import { BackButton } from "@/shared/ui/back-button";
import { Button } from "@/shared/ui/button";
import { GlassCard } from "@/shared/ui/glass-card";
import { ScreenLayout } from "@/widgets/screen-layout";

import { AudioPlayer } from "./audio-player";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; practice: ProgramPractice; practiceImages: string[]; programDay: number };

const daypartNames = { morning: "Утро", evening: "Вечер" } as const;

/** Длительность записи, пока аудио не загружено в админке. */
const PLACEHOLDER_AUDIO_SECONDS = 5 * 60;

/**
 * Экран практики. «Мышление по навигатору дня» – текст и заметки для себя;
 * практика с аудио («Внутренняя улыбка») – плеер и текст, без заметок.
 */
export function PracticePage({ practiceId }: { practiceId: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "loading" });
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [pending, setPending] = useState(false);
  const notePath = `/api/program/notes/${encodeURIComponent(practiceId)}`;

  useLayoutEffect(() => {
    const practice = rememberedPractice(practiceId);
    if (!practice) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ status: "ready", practice, practiceImages: [], programDay: 1 });
  }, [practiceId]);

  useEffect(() => {
    // На GitHub Pages сервера нет: заметки не хранятся, поле пустое.
    loadMyProgram()
      .then(async (program) => {
        const practice = [...program.morning, ...program.evening, ...program.weekly, ...program.awareness].find(
          (item) => item.id === practiceId,
        );
        if (!practice) throw new Error("Практика не найдена");
        setState({
          status: "ready",
          practice,
          practiceImages: program.backgrounds.practice,
          programDay: program.programDay,
        });
        if (!isThinkingPractice(practice) || isStaticPrototype) return;
        const saved = await request<{ text: string }>(notePath);
        setNote(saved.text);
        setSavedNote(saved.text);
      })
      .catch((loadError: Error) => setState({ status: "error", message: loadError.message }));
  }, [notePath, practiceId]);

  const practice = state.status === "ready" ? state.practice : null;
  const withAudio = practice ? isAudioPractice(practice) : false;
  const reading = practice ? isAwarenessPractice(practice) : false;
  const practiceImages = state.status === "ready" ? state.practiceImages : [];
  const practiceImage = practiceImages.length
    ? practiceImages[((state.status === "ready" ? state.programDay : 1) - 1) % practiceImages.length]
    : null;

  // Пока практики нет, не рисуем экран: иначе на миг вспыхивает чужой фон и заголовок «Практика».
  if (state.status === "loading") return null;

  async function saveNote() {
    if (withAudio) return;
    if (note.trim() !== savedNote) await request(notePath, { method: "PUT", body: JSON.stringify({ text: note }) });
  }

  async function finish(done: boolean) {
    setPending(true);
    try {
      if (isStaticPrototype) return router.push(routes.program);
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
      background={reading || withAudio ? "04_earth_04_practice" : "04_earth_03_lizard"}
      imageSrc={practiceImage}
      beforeTitle={
        practice?.daypart && (
          <p className="type-caption text-muted-foreground">{daypartNames[practice.daypart]} · каждый день</p>
        )
      }
      title={practice?.title ?? "Практика"}
      actions={
        reading ? (
          <BackButton onClick={() => router.push(routes.program)} />
        ) : (
          <>
            <BackButton onClick={() => void finish(false)} />
            <Button size="cta" className="flex-1" disabled={pending || !practice} onClick={() => void finish(true)}>
              Выполнено
            </Button>
          </>
        )
      }
    >
      {state.status === "error" && (
        <GlassCard>
          <p role="alert" className="type-secondary text-destructive">
            {typograph(state.message)}
          </p>
        </GlassCard>
      )}
      {practice && reading && (
        <GlassCard className="bg-background/80">
          <p className="type-body whitespace-pre-line text-foreground">{typograph(practice.body)}</p>
        </GlassCard>
      )}
      {practice && !reading && withAudio && (
        <>
          <AudioPlayer durationSeconds={PLACEHOLDER_AUDIO_SECONDS} />
          {practice.body && (
            <GlassCard className="bg-background/80">
              <PracticeText body={practice.body} />
            </GlassCard>
          )}
        </>
      )}
      {practice && !reading && !withAudio && (
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

/** Пронумерованные шаги – списком с отступом под номером, остальное – абзацем. */
function PracticeText({ body }: { body: string }) {
  const steps = numberedSteps(body);
  if (!steps) return <p className="type-body whitespace-pre-line text-foreground">{typograph(body)}</p>;
  return (
    <ol className="list-decimal space-y-0 pl-6 type-body text-foreground marker:text-foreground">
      {steps.map((step) => (
        <li key={step}>{typograph(step)}</li>
      ))}
    </ol>
  );
}
