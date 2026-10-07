"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { BirthPreviewPage } from "@/views/birth-preview";

function BirthFromQuery() {
  const params = useSearchParams();
  const view = params.get("view") === "square" ? "square" : "practices";
  return <BirthPreviewPage view={view} />;
}

export default function Page() {
  return (
    <Suspense>
      <BirthFromQuery />
    </Suspense>
  );
}
