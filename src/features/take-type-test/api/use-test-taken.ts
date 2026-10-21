"use client";

import { useEffect, useState } from "react";

import type { PersonType } from "@/entities/person-type";
import { useProgress } from "@/entities/progress";
import { request, type RequestError } from "@/shared/api/request";
import { isDevelopment, isStaticPrototype } from "@/shared/config/env";

/**
 * Пройден ли уже тест: по серверу, а без сервера (GitHub Pages) и при разработке без входа — по браузеру.
 * null — ещё проверяем.
 */
export function useTestTaken(): boolean | null {
  const { testTaken: takenLocally } = useProgress();
  const [fromServer, setFromServer] = useState<boolean | "local" | null>(isStaticPrototype ? "local" : null);

  useEffect(() => {
    if (isStaticPrototype) return;
    request<{ type: PersonType | null }>("/api/type-test")
      .then(({ type }) => setFromServer(type !== null))
      .catch((error: RequestError) => setFromServer(error.status === 401 && isDevelopment ? "local" : false));
  }, []);

  return fromServer === "local" ? takenLocally : fromServer;
}
