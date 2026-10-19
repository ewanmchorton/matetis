"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ElementScoresList, WuXingCircle, type DigitCounts, type ElementScore } from "@/entities/birth-reading";
import type { PersonType } from "@/entities/person-type";
import { request } from "@/shared/api/request";
import { isStaticPrototype } from "@/shared/config/env";
import { routes } from "@/shared/config/routes";

type StudentDetails = {
  person: { id: string; name: string; email: string; registeredAt: string };
  birthReading: { birthDate: string; digitCounts: DigitCounts; elements: ElementScore[] } | null;
  typeHistory: { takenAt: string; type: PersonType }[];
};

type DetailsState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: StudentDetails };

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

/** «1988-03-15» → «15.03.1988» без перевода во время суток и часовые пояса. */
const formatBirthDate = (value: string) => value.split("-").reverse().join(".");

function useStudent(id: string | null): DetailsState {
  const [state, setState] = useState<DetailsState>({ status: "loading" });
  useEffect(() => {
    if (isStaticPrototype || !id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({
        status: "error",
        message: isStaticPrototype ? "Карточка ученика работает только на сервере." : "Не указан ученик.",
      });
      return;
    }
    request<StudentDetails>(`/api/admin/students/${encodeURIComponent(id)}`)
      .then((data) => setState({ status: "ready", data }))
      .catch((error: Error) => setState({ status: "error", message: error.message }));
  }, [id]);
  return state;
}

export function AdminStudentPage() {
  const state = useStudent(useSearchParams().get("id"));

  return (
    <>
      <Link href={routes.adminStudents} className="text-sm text-muted-foreground hover:text-foreground">
        ← Все ученики
      </Link>

      {state.status === "loading" && <p className="text-sm text-muted-foreground">Загружаем…</p>}
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      {state.status === "ready" && <StudentDetailsView data={state.data} />}
    </>
  );
}

function StudentDetailsView({ data: { person, birthReading, typeHistory } }: { data: StudentDetails }) {
  const currentType = typeHistory[0]?.type;

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{person.name}</h1>
        <p className="text-sm text-muted-foreground">
          {person.email} · зарегистрирован(а) {formatDate(person.registeredAt)}
        </p>
      </div>

      <section className="space-y-4 rounded-2xl border bg-background p-5">
        <div className="space-y-1">
          <h2 className="font-semibold">Стихии по дате рождения</h2>
          <p className="text-sm text-muted-foreground">
            {birthReading
              ? `Дата рождения ${formatBirthDate(birthReading.birthDate)}. Количество цифр квадрата Пифагора по стихиям.`
              : "Дату рождения пока не указал(а)."}
          </p>
        </div>
        {birthReading && (
          <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
            <ElementScoresList scores={birthReading.elements} />
            <WuXingCircle scores={birthReading.elements} />
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border bg-background p-5">
        <div className="space-y-1">
          <h2 className="font-semibold">Тип</h2>
          <p className="text-sm text-muted-foreground">
            {currentType ? `Сейчас: ${currentType.name}.` : "Тест пока не пройден."}
          </p>
        </div>
        {typeHistory.length > 0 && (
          <ul className="divide-y text-sm">
            {typeHistory.map((attempt) => (
              <li key={attempt.takenAt} className="flex gap-4 py-2.5">
                <span className="w-40 text-muted-foreground">{formatDate(attempt.takenAt)}</span>
                <span>{attempt.type.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
