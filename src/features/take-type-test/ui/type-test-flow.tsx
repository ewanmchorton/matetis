"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";

import { progressActions } from "@/entities/progress";
import type { TypeTest } from "@/entities/type-test";
import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";

import { calculateType, type TestAnswers } from "../model/calculate-type";
import { SectionChoice } from "./section-choice";

export type TestVariant = "steps" | "page";

function FullInstruction({ test }: { test: TypeTest }) {
  return (
    <details className="group rounded-xl border bg-card p-4 text-sm">
      <summary className="cursor-pointer font-medium marker:text-muted-foreground">
        Полная инструкция к тесту
      </summary>
      <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground">
        {test.instruction.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>
    </details>
  );
}

export function TypeTestFlow({ test, variant }: { test: TypeTest; variant: TestVariant }) {
  return variant === "page" ? <SinglePageTest test={test} /> : <StepByStepTest test={test} />;
}

function useFinish(test: TypeTest) {
  const router = useRouter();
  return (answers: TestAnswers) => {
    const type = calculateType(test, answers);
    if (type) progressActions.setType(type.id);
    router.push(routes.typeResult);
  };
}

/** Вариант из черновика: инструкция и обе группы на одной странице. */
function SinglePageTest({ test }: { test: TypeTest }) {
  const [answers, setAnswers] = useState<TestAnswers>({});
  const finish = useFinish(test);
  const complete = test.groups.every((g) => answers[g.id]);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Тест на определение типа</h1>
        <p className="leading-relaxed text-muted-foreground">{test.shortInstruction}</p>
        <FullInstruction test={test} />
      </div>
      {test.groups.map((g) => (
        <section key={g.id} className="space-y-3">
          <h2 className="text-lg font-semibold">{g.title}</h2>
          <SectionChoice
            group={g}
            value={answers[g.id]}
            onChange={(id) => setAnswers({ ...answers, [g.id]: id })}
          />
        </section>
      ))}
      <Button size="lg" className="h-12 w-full text-base" disabled={!complete} onClick={() => finish(answers)}>
        Узнать свой тип
      </Button>
    </div>
  );
}

/** Вариант «по шагам»: инструкция → по одной группе на экран → проверка результата. */
function StepByStepTest({ test }: { test: TypeTest }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<TestAnswers>({});
  const finish = useFinish(test);

  const totalSteps = test.groups.length + 2;
  const group = step >= 1 && step <= test.groups.length ? test.groups[step - 1] : undefined;
  const isConfirm = step === totalSteps - 1;
  const candidate = isConfirm ? calculateType(test, answers) : undefined;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Шаг {step + 1} из {totalSteps}
          </span>
          {group && <span>{group.title}</span>}
        </div>
        <Progress value={(step / (totalSteps - 1)) * 100} />
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">Как проходить тест</h1>
          <ul className="space-y-3 text-[15px] leading-relaxed">
            <li>• Перед вами будут две группы описаний. В каждой выберите одно — самое похожее на вас.</li>
            <li>• Не обязательно соглашаться с каждым словом: достаточно 80–90% и общего ощущения «это про меня».</li>
            <li>• Не перепроверяйте выбор — доверяйте интуиции.</li>
          </ul>
          <FullInstruction test={test} />
        </div>
      )}

      {group && (
        <div className="space-y-4">
          <h1 className="text-xl font-semibold">
            Какое описание больше всего похоже на вас?
          </h1>
          <SectionChoice
            group={group}
            value={answers[group.id]}
            onChange={(id) => setAnswers({ ...answers, [group.id]: id })}
          />
        </div>
      )}

      {isConfirm && (
        <div className="space-y-4">
          <h1 className="text-xl font-semibold">Похоже на вас?</h1>
          <div className="space-y-3 rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Предварительный результат</p>
            <p className="text-2xl font-semibold">{candidate?.name ?? "Тип не определён"}</p>
            <div className="flex flex-wrap gap-2">
              {candidate?.traits.map((t) => (
                <span key={t} className="rounded-full bg-muted px-3 py-1 text-sm">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Если описание совсем не про вас, вернитесь и выберите заново — это нормально.
          </p>
        </div>
      )}

      <div className="mt-auto flex gap-3 pt-4">
        {isConfirm ? (
          <>
            <Button variant="outline" size="lg" className="h-11" onClick={() => setStep(1)}>
              <RotateCcw />
              Выбрать заново
            </Button>
            <Button size="lg" className="h-11 flex-1" onClick={() => finish(answers)}>
              Да, это про меня
            </Button>
          </>
        ) : (
          <>
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
            <Button
              size="lg"
              className="h-11 flex-1"
              disabled={group ? !answers[group.id] : false}
              onClick={() => setStep(step + 1)}
            >
              {step === 0 ? "Начать" : "Дальше"}
              <ArrowRight />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
