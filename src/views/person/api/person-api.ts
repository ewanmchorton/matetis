"use client";

import { useCallback, useEffect, useState } from "react";

import type { CompanionStage } from "@/entities/companion";
import { people } from "@/entities/social";
import { request, type RequestError } from "@/shared/api/request";
import { isDevelopment, isStaticPrototype } from "@/shared/config/env";

export type Friendship = "none" | "friend" | "incoming" | "outgoing";
export type FriendAction = "send" | "cancel" | "accept" | "decline" | "remove";

/** То, что экран получает с сервера (GET /api/people/[id]). */
export type PersonProfile = {
  person: { id: string; name: string };
  friendship: Friendship;
  companionStage: CompanionStage;
};

export type PersonState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error"; message: string }
  | { status: "ready"; profile: PersonProfile; demo: boolean };

// Демо-данные: на GitHub Pages (там нет сервера) и при локальной разработке без входа.
const demoFriendship: Record<string, Friendship> = { olga: "incoming", pavel: "none" };
const demoStages: Record<string, CompanionStage> = { marina: 1, igor: 3, svetlana: 4, denis: 6, olga: 2, pavel: 5 };

function demoProfile(id: string): PersonProfile | null {
  const person = people.find((item) => item.id === id);
  if (!person) return null;
  return {
    person: { id: person.id, name: person.name },
    friendship: demoFriendship[id] ?? "friend",
    companionStage: demoStages[id] ?? 1,
  };
}

/** Что становится с дружбой после действия – для демо без сервера. */
const demoResult: Record<FriendAction, Friendship> = {
  send: "outgoing",
  cancel: "none",
  accept: "friend",
  decline: "none",
  remove: "none",
};

/** Профиль человека и действия с дружбой. */
export function usePerson(id: string) {
  const [state, setState] = useState<PersonState>({ status: "loading" });
  const [actionError, setActionError] = useState<string | null>(null);

  const showDemo = useCallback(() => {
    const profile = demoProfile(id);
    setState(profile ? { status: "ready", profile, demo: true } : { status: "not-found" });
  }, [id]);

  const load = useCallback(async () => {
    if (isStaticPrototype) return showDemo();
    try {
      setState({ status: "ready", profile: await request<PersonProfile>(`/api/people/${encodeURIComponent(id)}`), demo: false });
    } catch (error) {
      const { status, message } = error as RequestError;
      // При разработке экран открывается и без входа – через меню «Экраны».
      if (status === 401 && isDevelopment) return showDemo();
      setState(status === 400 ? { status: "not-found" } : { status: "error", message });
    }
  }, [id, showDemo]);

  useEffect(() => {
    // Загрузка с сервера при открытии экрана.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function act(action: FriendAction) {
    if (state.status !== "ready") return;
    setActionError(null);
    if (state.demo) {
      return setState({ ...state, profile: { ...state.profile, friendship: demoResult[action] } });
    }
    try {
      const profile = await request<PersonProfile>(`/api/people/${encodeURIComponent(id)}`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      setState({ status: "ready", profile, demo: false });
    } catch (error) {
      setActionError((error as Error).message);
    }
  }

  return { state, actionError, act };
}
