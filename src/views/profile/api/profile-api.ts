"use client";

import { useCallback, useEffect, useState } from "react";

import { isDevelopment, isStaticPrototype } from "@/shared/config/env";

import type { ProfileData } from "../model/types";

/** Демо-данные: на GitHub Pages (там нет сервера) и при локальной разработке без входа. */
const demoProfile: ProfileData = {
  me: { name: "Анна", email: "anna@example.ru" },
  settings: { publishEvents: true, autoMatchConsent: true },
  friends: [
    { id: "marina", name: "Марина", avatar: null },
    { id: "igor", name: "Игорь", avatar: null },
    { id: "svetlana", name: "Светлана", avatar: null },
    { id: "denis", name: "Денис", avatar: null },
  ],
  incoming: [{ id: "olga", name: "Ольга", avatar: null }],
};

export type ProfileState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ProfileData; demo: boolean };

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${basePath}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : "Не получилось. Проверьте интернет и попробуйте ещё раз";
    throw Object.assign(new Error(message), { status: response.status });
  }
  return body as T;
}

/** Данные профиля и действия с ними. */
export function useProfile() {
  const [state, setState] = useState<ProfileState>({ status: "loading" });
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (isStaticPrototype) return setState({ status: "ready", data: demoProfile, demo: true });
    try {
      setState({ status: "ready", data: await request<ProfileData>("/api/profile"), demo: false });
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status === 401) {
        // При разработке экран открывается и без входа — через меню «Экраны».
        setState(isDevelopment ? { status: "ready", data: demoProfile, demo: true } : { status: "signed-out" });
      } else {
        setState({ status: "error", message: (error as Error).message });
      }
    }
  }, []);

  useEffect(() => {
    // Загрузка с сервера при открытии экрана.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const demo = state.status === "ready" && state.demo;

  function update(change: (data: ProfileData) => ProfileData) {
    setState((current) => (current.status === "ready" ? { ...current, data: change(current.data) } : current));
  }

  async function setPublishEvents(publishEvents: boolean) {
    setActionError(null);
    update((data) => ({ ...data, settings: { ...data.settings, publishEvents } }));
    if (demo) return;
    try {
      const settings = await request<ProfileData["settings"]>("/api/profile/settings", {
        method: "PATCH",
        body: JSON.stringify({ publishEvents }),
      });
      update((data) => ({ ...data, settings }));
    } catch (error) {
      update((data) => ({ ...data, settings: { ...data.settings, publishEvents: !publishEvents } }));
      setActionError((error as Error).message);
    }
  }

  async function answerRequest(personId: string, action: "accept" | "decline") {
    setActionError(null);
    if (demo) {
      return update((data) => {
        const person = data.incoming.find((p) => p.id === personId);
        return {
          ...data,
          incoming: data.incoming.filter((p) => p.id !== personId),
          friends: action === "accept" && person ? [...data.friends, person] : data.friends,
        };
      });
    }
    try {
      await request(`/api/friend-requests/${encodeURIComponent(personId)}`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      await load();
    } catch (error) {
      setActionError((error as Error).message);
    }
  }

  return { state, actionError, setPublishEvents, answerRequest };
}
