"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { routes } from "@/shared/config/routes";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(routes.auth);
  }, [router]);

  return null;
}
