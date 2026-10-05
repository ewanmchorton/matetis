"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { progressActions } from "@/entities/progress";
import type { TestQuestion } from "@/entities/type-test";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";

import { calculateType } from "../model/calculate-type";

export function TypeTestFlow({ questions }: { questions: TestQuestion[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const question = questions[step];
  const selected = answers[question.id];
  const isLast = step === questions.length - 1;

  const next = () => {
    if (!isLast) {
      setStep(step + 1);
      return;
    }
    progressActions.setType(calculateType(questions, answers));
    router.push(routes.typeResult);
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Вопрос {step + 1} из {questions.length}
          </span>
          <span>{Math.round((step / questions.length) * 100)}%</span>
        </div>
        <Progress value={(step / questions.length) * 100} />
      </div>

      <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">{question.text}</h1>

      <div className="grid gap-3" role="radiogroup" aria-label={question.text}>
        {question.options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={selected === o.id}
            onClick={() => setAnswers({ ...answers, [question.id]: o.id })}
            className={cn(
              "rounded-xl border bg-card px-4 py-4 text-left text-base transition-colors hover:border-primary/50",
              selected === o.id && "border-primary bg-primary/5 ring-2 ring-primary/20",
            )}
          >
            {o.text}
          </button>
        ))}
      </div>

      <div className="mt-auto flex gap-3 pt-4">
        <Button
          variant="outline"
          size="lg"
          className="h-11"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          <ArrowLeft />
          Назад
        </Button>
        <Button size="lg" className="h-11 flex-1" disabled={!selected} onClick={next}>
          {isLast ? "Узнать свой тип" : "Дальше"}
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
