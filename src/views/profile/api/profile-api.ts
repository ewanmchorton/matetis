"use client";

import { useCallback, useEffect, useState } from "react";

import { request, type RequestError } from "@/shared/api/request";
import { isDevelopment, isStaticPrototype } from "@/shared/config/env";

import type { ProfileData } from "../model/types";

/** Демо-данные: на GitHub Pages (там нет сервера) и при локальной разработке без входа. */
const demoProfile: ProfileData = {
  me: { name: "Анна", contact: "anna@example.ru", companionStage: 5, typeId: "t7", birthDate: "1992-03-14" },
  settings: { autoMatchConsent: true, phraseNotifications: true, phraseFromHour: 9, phraseToHour: 21 },
  friends: [
    { id: "marina", name: "Марина", companionStage: 1 },
    { id: "igor", name: "Игорь", companionStage: 3 },
    { id: "svetlana", name: "Светлана", companionStage: 4 },
    { id: "denis", name: "Денис", companionStage: 6 },
  ],
  incoming: [{ id: "olga", name: "Ольга" }],
};

export type ProfileState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ProfileData; demo: boolean };

/** Данные профиля и действия с ними. */
export function useProfile() {
  const [state, setState] = useState<ProfileState>({ status: "loading" });
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (isStaticPrototype) return setState({ status: "ready", data: demoProfile, demo: true });
    try {
      setState({ status: "ready", data: await request<ProfileData>("/api/profile"), demo: false });
    } catch (error) {
      const { status, message } = error as RequestError;
      if (status === 401) {
        // При разработке экран открывается и без входа – через меню «Экраны».
        setState(isDevelopment ? { status: "ready", data: demoProfile, demo: true } : { status: "signed-out" });
      } else {
        setState({ status: "error", message });
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

  /** Фраза дня: согласие и промежуток. Вместе с ними сохраняется часовой пояс телефона. */
  async function setPhraseSettings(changes: Partial<ProfileData["settings"]>) {
    setActionError(null);
    const before = state.status === "ready" ? state.data.settings : null;
    update((data) => ({ ...data, settings: { ...data.settings, ...changes } }));
    if (demo) return;
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const settings = await request<ProfileData["settings"]>("/api/profile/settings", {
        method: "PATCH",
        body: JSON.stringify({ ...changes, timeZone }),
      });
      update((data) => ({ ...data, settings }));
    } catch (error) {
      if (before) update((data) => ({ ...data, settings: before }));
      setActionError((error as Error).message);
    }
  }

  /** Новая дата рождения: сервер пересчитывает квадрат Пифагора, от него зависят практики на слабую стихию. */
  async function setBirthDate(birthDate: string) {
    setActionError(null);
    const before = state.status === "ready" ? state.data.me.birthDate : null;
    update((data) => ({ ...data, me: { ...data.me, birthDate } }));
    if (demo) return;
    try {
      await request("/api/birth-reading", { method: "POST", body: JSON.stringify({ birthDate }) });
    } catch (error) {
      update((data) => ({ ...data, me: { ...data.me, birthDate: before } }));
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
          friends: action === "accept" && person ? [...data.friends, { ...person, companionStage: 2 }] : data.friends,
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

  return { state, actionError, setPhraseSettings, setBirthDate, answerRequest };
}
