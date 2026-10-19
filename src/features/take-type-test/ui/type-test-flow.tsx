"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { TypeTest } from "@/entities/type-test";
import type { RequestError } from "@/shared/api/request";
import { routes } from "@/shared/config/routes";
import { toDateKey } from "@/shared/lib/date";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { GlassCard } from "@/shared/ui/glass-card";
import { Input } from "@/shared/ui/input";
import { ScreenLayout } from "@/widgets/screen-layout";

import { saveTestResult } from "../api/save-test-result";
import { calculateType, type TestAnswers } from "../model/calculate-type";
import { SectionChoice } from "./section-choice";
import { StepProgress } from "./step-progress";

const shortRules = [
  "Вам будут представлены две группы описаний. В каждой — выберите один пункт, который лучше всего описывает вас.",
  "Не обязательно соглашаться с каждым словом: достаточно 80% ощущения, что «это про меня».",
  "Не перепроверяйте выбор — доверяйте интуиции.",
];

/** Подписи вариантов первой группы — буквы, как в исходном тесте. Во второй группе — цифры. */
const groupOneMarkers = ["А", "Б", "В"];

function FullInstruction({ test }: { test: TypeTest }) {
  return (
    <GlassCard className="p-0">
      <details className="group">
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 type-secondary text-foreground [&::-webkit-details-marker]:hidden">
          <ChevronRight className="size-5 shrink-0 transition-transform group-open:rotate-90" aria-hidden />
          Инструкция к тесту от Жанны
        </summary>
        <div className="space-y-3 px-5 pb-5 type-secondary text-muted-foreground">
          {test.instruction.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </details>
    </GlassCard>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="cta" className="w-auto border-white/60 bg-background/80" onClick={onClick}>
      Назад
    </Button>
  );
}

/** Инструкция → по одной группе → дата рождения → сохранение и экран результата. */
export function TypeTestFlow({ test }: { test: TypeTest }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<TestAnswers>({});
  const [birthDate, setBirthDate] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = test.groups.length + 2;
  const group = step >= 1 && step <= test.groups.length ? test.groups[step - 1] : undefined;
  const today = toDateKey(new Date());

  function goTo(next: number) {
    setError(null);
    setStep(next);
    window.scrollTo({ top: 0 });
  }

  async function finish() {
    const type = calculateType(test, answers);
    const [group1, group2] = test.groups.map(
      (testGroup) => testGroup.sections.find((section) => section.id === answers[testGroup.id])?.code ?? "",
    );
    if (!type) return setError("Выберите по одному описанию в каждой группе");

    setPending(true);
    setError(null);
    try {
      await saveTestResult({ group1, group2 }, birthDate, type);
      router.push(routes.typeResult);
    } catch (saveError) {
      if ((saveError as RequestError).status === 401) return router.replace(routes.auth);
      setError((saveError as Error).message);
      setPending(false);
    }
  }

  if (step === 0) {
    return (
      <ScreenLayout
        variant="page"
        background="03_1_test"
        haze
        afterHaze={<FullInstruction test={test} />}
        beforeTitle={<StepProgress current={1} total={totalSteps} />}
        title="Как проходить тест"
        actions={
          <>
            <BackButton onClick={() => router.back()} />
            <Button size="cta" className="flex-1" onClick={() => goTo(1)}>
              Начать
            </Button>
          </>
        }
      >
        <ul className="list-disc space-y-4 pl-6 type-body text-foreground marker:text-foreground">
          {shortRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </ScreenLayout>
    );
  }

  if (group) {
    return (
      <ScreenLayout
        variant="page"
        background="03_1_test"
        beforeTitle={<StepProgress current={step + 1} total={totalSteps} label={group.title} />}
        title="Какое описание больше всего похоже на вас?"
        actions={
          <>
            <BackButton onClick={() => goTo(step - 1)} />
            <Button size="cta" className="flex-1" disabled={!answers[group.id]} onClick={() => goTo(step + 1)}>
              Дальше
            </Button>
          </>
        }
      >
        <SectionChoice
          group={group}
          markers={step === 1 ? groupOneMarkers : undefined}
          value={answers[group.id]}
          onChange={(id) => setAnswers({ ...answers, [group.id]: id })}
        />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      variant="hero"
      background="03_4_test"
      beforeTitle={<StepProgress current={totalSteps} total={totalSteps} />}
      title="Укажите вашу дату рождения"
      actions={
        <>
          <BackButton onClick={() => goTo(step - 1)} />
          <Button size="cta" className="flex-1" disabled={!birthDate || pending} onClick={() => void finish()}>
            Дальше
          </Button>
        </>
      }
    >
      {/* Календарь телефона. Пустое поле на iPhone ничего не показывает, поэтому подсказку рисуем сами. */}
      <div className="relative">
        <Input
          type="date"
          aria-label="Дата рождения"
          min="1900-01-01"
          max={today}
          value={birthDate}
          onChange={(event) => {
            setError(null);
            setBirthDate(event.target.value);
          }}
          className={cn(
            "peer h-(--field-height) appearance-none rounded-2xl border-input bg-background/70 px-4 text-left type-body backdrop-blur-sm md:text-[17px]",
            !birthDate && "text-transparent focus:text-foreground",
          )}
        />
        {!birthDate && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-4 flex items-center type-body text-muted-foreground/70 peer-focus:hidden"
          >
            ДД.ММ.ГГГГ
          </span>
        )}
      </div>
      {error && (
        <p role="alert" className="-mt-3 type-secondary text-destructive">
          {error}
        </p>
      )}
    </ScreenLayout>
  );
}
