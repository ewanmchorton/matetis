"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { TypeTestPage } from "@/views/type-test";

function TestFromQuery() {
  const params = useSearchParams();
  return <TypeTestPage variant={params.get("variant") === "page" ? "page" : "steps"} />;
}

export default function Page() {
  return (
    <Suspense>
      <TestFromQuery />
    </Suspense>
  );
}
