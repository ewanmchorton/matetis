"use client";

import { useEffect, useState } from "react";

import { request, type RequestError } from "@/shared/api/request";
import { isDevelopment, isStaticPrototype } from "@/shared/config/env";

import type { MyAccess } from "../model/types";

/**
 * Демо для GitHub Pages и разработки без входа: доступ открыт, экраны проходятся целиком.
 * ?demo=expired — «Срок подписки истёк».
 */
function demoAccess(): MyAccess {
  const expired = new URLSearchParams(window.location.search).get("demo") === "expired";
  const status: MyAccess["status"] = expired
    ? { kind: "expired", endedAt: "2026-01-01T00:00:00Z" }
    : { kind: "active", until: "2099-01-01T00:00:00Z", daysLeft: 999, expiring: false };
  return { status, contact: "anna@example.ru", adminPhone: "+375293344101", adminTelegram: "vernojit" };
}

export type MyAccessState = { status: "loading" } | { status: "signed-out" } | { status: "ready"; access: MyAccess };

/** Свой доступ с сервера (GET /api/access). */
export function useMyAccess(): MyAccessState {
  const [state, setState] = useState<MyAccessState>({ status: "loading" });

  useEffect(() => {
    if (isStaticPrototype) {
      // Адрес страницы известен только в браузере, поэтому демо выбираем здесь.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ status: "ready", access: demoAccess() });
      return;
    }
    request<MyAccess>("/api/access")
      .then((access) => setState({ status: "ready", access }))
      .catch((error: RequestError) => {
        if (error.status === 401 && isDevelopment) return setState({ status: "ready", access: demoAccess() });
        // Ошибка сети или не вошёл: экраны сами отправят на вход, доступ не открываем.
        setState({ status: "signed-out" });
      });
  }, []);

  return state;
}
