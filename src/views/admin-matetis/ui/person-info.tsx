"use client";

import { useEffect, useState } from "react";

import { ElementScoresList, WuXingCircle, type DigitCounts, type ElementScore } from "@/entities/birth-reading";
import type { PersonType } from "@/entities/person-type";
import { request } from "@/shared/api/request";

type PersonDetails = {
  birthReading: { birthDate: string; digitCounts: DigitCounts; elements: ElementScore[] } | null;
  typeHistory: { takenAt: string; type: PersonType }[];
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

/** «1988-03-15» → «15.03.1988» без перевода во время суток и часовые пояса. */
const formatBirthDate = (value: string) => value.split("-").reverse().join(".");

/** Тип и стихии по дате рождения в карточке Матэтиса. */
export function PersonInfo({ userId }: { userId: string }) {
  const [data, setData] = useState<PersonDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    request<PersonDetails>(`/api/admin/students/${encodeURIComponent(userId)}`)
      .then(setData)
      .catch((loadError: Error) => setError(loadError.message));
  }, [userId]);

  if (error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    );
  }
  if (!data) return <p className="text-sm text-muted-foreground">Загружаем тип и стихии…</p>;

  const currentType = data.typeHistory[0]?.type;
  return (
    <>
      <section className="space-y-3 border-t pt-4">
        <h2 className="font-semibold">Тип</h2>
        <p className="text-sm text-muted-foreground">
          {currentType ? `Сейчас: ${currentType.name}.` : "Тест пока не пройден."}
        </p>
        {data.typeHistory.length > 1 && (
          <ul className="divide-y text-sm">
            {data.typeHistory.map((attempt) => (
              <li key={attempt.takenAt} className="flex gap-4 py-2">
                <span className="w-36 text-muted-foreground">{formatDate(attempt.takenAt)}</span>
                <span>{attempt.type.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 border-t pt-4">
        <h2 className="font-semibold">Стихии по дате рождения</h2>
        <p className="text-sm text-muted-foreground">
          {data.birthReading
            ? `Дата рождения ${formatBirthDate(data.birthReading.birthDate)}.`
            : "Дату рождения пока не указал(а)."}
        </p>
        {data.birthReading && (
          <div className="space-y-4">
            <ElementScoresList scores={data.birthReading.elements} />
            <WuXingCircle scores={data.birthReading.elements} />
          </div>
        )}
      </section>
    </>
  );
}
