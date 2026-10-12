"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { progressActions } from "@/entities/progress";
import type { TypeTest } from "@/entities/type-test";
import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Progress } from "@/shared/ui/progress";

import { calculateType, type TestAnswers } from "../model/calculate-type";
import { SectionChoice } from "./section-choice";

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

function useFinish(test: TypeTest) {
  const router = useRouter();
  return (answers: TestAnswers, birthDate: string) => {
    const type = calculateType(test, answers);
    if (type) progressActions.setType(type.id);
    progressActions.setBirthDate(birthDate);
    router.push(routes.typeResult);
  };
}

function BirthDateFields({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Укажите вашу дату рождения</h1>
      <Input
        type="date"
        className="h-12"
        aria-label="Дата рождения"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

/** Инструкция → по одной группе → дата рождения → результат. */
export function TypeTestFlow({ test }: { test: TypeTest }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<TestAnswers>({});
  const [birthDate, setBirthDate] = useState("");
  const finish = useFinish(test);

  const totalSteps = test.groups.length + 2;
  const group = step >= 1 && step <= test.groups.length ? test.groups[step - 1] : undefined;
  const isBirth = step === totalSteps - 1;

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
          <h1 className="text-xl font-semibold">Какое описание больше всего похоже на вас?</h1>
          <SectionChoice
            group={group}
            value={answers[group.id]}
            onChange={(id) => setAnswers({ ...answers, [group.id]: id })}
          />
        </div>
      )}

      {isBirth && <BirthDateFields value={birthDate} onChange={setBirthDate} />}

      <div className="mt-auto flex gap-3 pt-4">
        {isBirth ? (
          <>
            <Button variant="outline" size="lg" className="h-11" onClick={() => setStep(step - 1)}>
              <ArrowLeft />
              Назад
            </Button>
            <Button
              size="lg"
              className="h-11 flex-1"
              disabled={!birthDate}
              onClick={() => finish(answers, birthDate)}
            >
              Дальше
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
