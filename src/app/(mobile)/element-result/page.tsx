"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { ElementResultPage } from "@/views/element-result";

function ElementResultFromQuery() {
  const params = useSearchParams();
  return <ElementResultPage earned={params.get("badge") !== "0"} />;
}

export default function Page() {
  return (
    <Suspense>
      <ElementResultFromQuery />
    </Suspense>
  );
}
