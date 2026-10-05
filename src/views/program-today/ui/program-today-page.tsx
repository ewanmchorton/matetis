"use client";

import { getCurrentElement } from "@/entities/element";
import { getProgram, getTodayPractice } from "@/entities/practice";
import { useProgress } from "@/entities/progress";
import { EmptyState } from "@/shared/ui/empty-state";
import { CalendarX } from "lucide-react";
import { PracticeDetailPage } from "@/views/practice-detail";

export function ProgramTodayPage() {
  const { typeId } = useProgress();
  const practice = getTodayPractice(getProgram(typeId ?? "t1", getCurrentElement().id).daily);

  if (!practice) {
    return (
      <EmptyState
        icon={CalendarX}
        title="На сегодня практик нет"
        description="Мастер скоро добавит новые практики для вашей стихии."
      />
    );
  }
  return <PracticeDetailPage practice={practice} />;
}
