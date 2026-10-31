"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { ElementBadge, getElement } from "@/entities/element";
import type { MyProgram, ProgramPractice } from "@/entities/program/server";
import { PhrasePrompt } from "@/features/phrase-notifications";
import { routes } from "@/shared/config/routes";
import { typograph } from "@/shared/lib/typograph";
import { Button } from "@/shared/ui/button";
import { GlassCard } from "@/shared/ui/glass-card";
import { TextGlow } from "@/shared/ui/text-glow";
import { ScreenLayout } from "@/widgets/screen-layout";

import { useMyProgram } from "../api/program-api";
import { PracticeRow } from "./practice-row";
import { WeekLetters } from "./week-letters";
import { WelcomeVideo } from "./welcome-video";

/** «Мышление по навигатору дня» открывается на своём экране с заметками. */
export const isThinkingPractice = (practice: ProgramPractice) => practice.title.startsWith("Мышление по навигатору");

const weekdays = ["понедельник", "вторник", "среду", "четверг", "пятницу", "субботу", "воскресенье"];

/** «2026-12-25» → «Пятница, 25 декабря». */
function longDate(day: string) {
  const date = new Date(`${day}T12:00:00Z`);
  const text = date.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Подпись под еженедельной практикой: когда сделана или что внутри. */
function weeklyMeta(practice: ProgramPractice) {
  if (practice.doneOn) {
    const index = (new Date(`${practice.doneOn}T12:00:00Z`).getUTCDay() + 6) % 7;
    return `Сделано в ${weekdays[index]}`;
  }
  return practiceMeta(practice);
}

function practiceMeta(practice: ProgramPractice) {
  if (practice.hasVideo) return "Видео";
  if (practice.hasAudio) return "Аудио";
  return undefined;
}

/** Заголовок как в макете 04_01: «Доброе утро, Ваня». */
function greeting(name: string) {
  const firstName = name.split(" ")[0];
  return firstName ? `Доброе утро, ${firstName}` : "Доброе утро";
}

/** Заголовок блока прямо на картинке: подложка по размеру текста, чтобы он читался. */
function SectionTitle({ title, note, action }: { title: string; note?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="space-y-1">
        <TextGlow kind="title">
          <h2 className="type-section text-foreground">{title}</h2>
        </TextGlow>
        {note && (
          <TextGlow kind="text">
            <p className="type-caption text-muted-foreground">{note}</p>
          </TextGlow>
        )}
      </div>
      {action}
    </div>
  );
}

function DayBlock({
  title,
  practices,
  onDone,
}: {
  title: string;
  practices: ProgramPractice[];
  onDone: (ids: string[], done: boolean) => void;
}) {
  if (practices.length === 0) return null;
  const notDone = practices.filter((practice) => !practice.doneOn).map((practice) => practice.id);
  return (
    <section className="space-y-3" aria-label={title}>
      <SectionTitle
        title={title}
        action={
          notDone.length > 0 && (
            <Button
              variant="outline"
              size="cta-sm"
              className="h-9 rounded-xl border-white/60 bg-background/80 px-3 type-caption"
              onClick={() => onDone(notDone, true)}
            >
              Отметить всё
            </Button>
          )
        }
      />
      <GlassCard className="divide-y divide-foreground/8 px-5 py-1">
        {practices.map((practice) => (
          <PracticeRow
            key={practice.id}
            title={practice.title}
            meta={practiceMeta(practice)}
            done={Boolean(practice.doneOn)}
            onDone={(done) => onDone([practice.id], done)}
            href={isThinkingPractice(practice) ? `${routes.practice}/${practice.id}` : undefined}
          />
        ))}
      </GlassCard>
    </section>
  );
}

function NavigatorCard({ navigator }: { navigator: NonNullable<MyProgram["navigator"]> }) {
  const title = navigator.kind === "elders" ? navigator.elders?.title : navigator.parts[0]?.title;
  return (
    <Link href={routes.navigator} className="block">
      <GlassCard className="space-y-3">
        <p className="type-caption text-muted-foreground">Навигатор дня</p>
        <h2 className="font-display text-[26px] leading-[1.2] font-medium text-foreground">{typograph(title ?? "")}</h2>
        <p className="flex items-center gap-1 type-secondary text-primary">
          {navigator.newTask ? "Новое задание" : "Внутри — задание на сегодня"}
          <ChevronRight className="size-4" aria-hidden />
        </p>
      </GlassCard>
    </Link>
  );
}

/** Главный экран программы: навигатор, утро, вечер, неделя, еженедельные практики, осознания. */
export function ProgramPage() {
  const { state, actionError, setDone, markWelcomeVideoSeen } = useMyProgram();
  const program = state.status === "ready" ? state.program : null;
  const element = program && getElement(program.season.elementId);
  const daily = program ? [...program.morning, ...program.evening] : [];
  const elementVideo = program?.elementVideo;

  const content = (
      <>
      {state.status === "loading" && <GlassCard aria-hidden className="h-72 animate-pulse" />}
      {state.status === "error" && (
        <GlassCard>
          <p role="alert" className="type-secondary text-destructive">
            {typograph(state.message)}
          </p>
        </GlassCard>
      )}

      {program && element && (
        <>
          <PhrasePrompt />
          {program.navigator && <NavigatorCard navigator={program.navigator} />}

          <DayBlock title="Утро" practices={program.morning} onDone={(ids, done) => void setDone(ids, done)} />
          <DayBlock title="Вечер" practices={program.evening} onDone={(ids, done) => void setDone(ids, done)} />

          <GlassCard className="space-y-3" aria-label="Эта неделя">
            <div className="flex items-center justify-between gap-3 type-caption text-muted-foreground">
              <span>Эта неделя</span>
              <span>
                Сегодня {daily.filter((practice) => practice.doneOn).length} из {daily.length}
              </span>
            </div>
            <WeekLetters week={program.week} today={program.today} />
            <p className="type-caption text-muted-foreground">
              {typograph("Буква заполняется после первой практики за день")}
            </p>
          </GlassCard>

          {(program.weekly.length > 0 || (elementVideo && !elementVideo.seen)) && (
            <section className="space-y-3" aria-label="На этой неделе">
              <SectionTitle title="На этой неделе" note="Один раз, в любой день" />
              <GlassCard className="divide-y divide-foreground/8 px-5 py-1">
                {elementVideo && !elementVideo.seen && (
                  <PracticeRow
                    title={`Видео по стихии ${element.genitive}`}
                    meta="Видео"
                    done={false}
                    href={routes.elementVideo}
                  />
                )}
                {program.weekly.map((practice) => (
                  <PracticeRow
                    key={practice.id}
                    title={practice.title}
                    meta={weeklyMeta(practice)}
                    done={Boolean(practice.doneOn)}
                    onDone={(done) => void setDone([practice.id], done)}
                  />
                ))}
              </GlassCard>
            </section>
          )}

          {program.awareness.length > 0 && (
            <section className="space-y-3" aria-label="Осознание">
              <SectionTitle title="Осознание" note="На весь период стихии" />
              {program.awareness.map((practice) => (
                <GlassCard key={practice.id} className="space-y-2">
                  <p className="type-caption text-muted-foreground">
                    {practice.forWeakElement && program.person.weakElement
                      ? `Слабая стихия: ${getElement(program.person.weakElement).name}`
                      : practice.title}
                  </p>
                  {practice.body && <p className="type-body text-foreground">{typograph(practice.body)}</p>}
                </GlassCard>
              ))}
            </section>
          )}

          {elementVideo?.seen && (
            <GlassCard className="px-5 py-1">
              <PracticeRow title={`Видео по стихии ${element.genitive}`} meta="Видео" done href={routes.elementVideo} />
            </GlassCard>
          )}

          {actionError && (
            <p role="alert" className="type-caption text-destructive">
              {typograph(actionError)}
            </p>
          )}

          {program.showWelcomeVideo && program.welcomeVideo && (
            <WelcomeVideo video={program.welcomeVideo} onSeen={() => void markWelcomeVideoSeen()} />
          )}
        </>
      )}
      </>
    );

  return (
    <ScreenLayout
      variant="page"
      background="04_earth_01_program"
      titleGlow
      title={program ? greeting(program.person.name) : "Программа"}
      subtitle={
        program && element ? (
          <span className="flex flex-col gap-2">
            <span className="flex flex-wrap items-center gap-2">
              {program.person.typeName && <span>Тип «{program.person.typeName}»</span>}
              {program.person.typeName && <span aria-hidden>·</span>}
              <span>стихия</span>
              <ElementBadge element={element} />
            </span>
            <span>{longDate(program.today)}</span>
          </span>
        ) : undefined
      }
      afterHaze={content}
    />
  );
}
