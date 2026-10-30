"use client";

import { CurrentElementCard } from "@/features/metal-switch";

/** Обзор: текущая стихия. Осенью — день перехода на Металл. */
export function AdminOverviewPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Обзор</h1>
      <CurrentElementCard />
    </>
  );
}
