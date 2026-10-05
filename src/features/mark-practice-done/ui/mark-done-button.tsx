"use client";

import { Check, RotateCcw } from "lucide-react";

import { progressActions, useProgress } from "@/entities/progress";
import { Button } from "@/shared/ui/button";

export function MarkDoneButton({
  practiceId,
  kind,
}: {
  practiceId: string;
  kind: "daily" | "ritual" | "state";
}) {
  const progress = useProgress();
  const list =
    kind === "ritual" ? progress.completedRitualIds : progress.completedPracticeIds;
  const done = list.includes(practiceId);
  const toggle = () =>
    kind === "ritual"
      ? progressActions.toggleRitual(practiceId)
      : progressActions.togglePractice(practiceId);

  if (done) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary/10 font-medium text-primary">
          <Check className="size-5" />
          Выполнено
        </div>
        <Button variant="ghost" size="lg" className="h-11" onClick={toggle}>
          <RotateCcw />
          Отменить отметку
        </Button>
      </div>
    );
  }

  return (
    <Button size="lg" className="h-11 w-full text-base" onClick={toggle}>
      <Check />
      Отметить выполнение
    </Button>
  );
}
