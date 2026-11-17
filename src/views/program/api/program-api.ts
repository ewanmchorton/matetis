"use client";

import { useCallback, useEffect, useState } from "react";

import type { CompanionScreen } from "@/entities/companion";
import { loadMyProgram } from "@/entities/program";
import type { MyProgram } from "@/entities/program/server";
import { request } from "@/shared/api/request";
import { isDevelopment, isStaticPrototype } from "@/shared/config/env";

export type ProgramState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; program: MyProgram };

/** ?demo=transition и ?demo=new-period – посмотреть экраны спутника без сервера (меню «Экраны»). */
function demoCompanionScreen(): CompanionScreen | null {
  if (!isDevelopment && !isStaticPrototype) return null;
  const demo = new URLSearchParams(window.location.search).get("demo");
  if (demo === "transition") return { kind: "transition", from: 3, to: 4 };
  if (demo === "new-period") return { kind: "new-period", elementId: "metal" };
  return null;
}

async function loadCompanionScreen(): Promise<CompanionScreen | null> {
  const demo = demoCompanionScreen();
  if (demo || isStaticPrototype) return demo;
  try {
    return (await request<{ screen: CompanionScreen | null }>("/api/program/companion")).screen;
  } catch {
    // Экран спутника не должен мешать программе: не загрузился – покажем в следующий раз.
    return null;
  }
}

/** Программа на сегодня и действия с ней: отметки практик, просмотр видео, экран спутника. */
export function useMyProgram() {
  const [state, setState] = useState<ProgramState>({ status: "loading" });
  const [actionError, setActionError] = useState<string | null>(null);
  const [companionScreen, setCompanionScreen] = useState<CompanionScreen | null>(null);

  const reload = useCallback(async () => {
    const companion = loadCompanionScreen().then(setCompanionScreen);
    try {
      setState({ status: "ready", program: await loadMyProgram() });
    } catch (loadError) {
      setState({ status: "error", message: (loadError as Error).message });
    }
    await companion;
  }, []);

  const markCompanionSeen = async () => {
    const demo = demoCompanionScreen() !== null;
    setCompanionScreen(null);
    if (demo || isStaticPrototype) return;
    await request("/api/program/companion", { method: "POST" }).catch(() => undefined);
  };

  useEffect(() => {
    // Загрузка при открытии экрана: состояние меняется после ответа сервера.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  async function run(action: () => Promise<unknown>) {
    // На GitHub Pages сервера нет: отметки живут только на экране.
    if (isStaticPrototype) return;
    setActionError(null);
    try {
      await action();
    } catch (actionFailure) {
      setActionError((actionFailure as Error).message);
    }
    await reload();
  }

  const setDone = (practiceIds: string[], done: boolean) => {
    // Галочка ставится сразу, сервер подтверждает после.
    setState((current) => {
      if (current.status !== "ready") return current;
      const program = current.program;
      const mark = (list: MyProgram["morning"]) =>
        list.map((item) => (practiceIds.includes(item.id) ? { ...item, doneOn: done ? program.today : null } : item));
      const marked = { morning: mark(program.morning), evening: mark(program.evening), weekly: mark(program.weekly) };
      // Буква дня закрашивается, если сегодня отмечена хоть одна практика или прочитан навигатор – как на сервере.
      const todayDone =
        [...marked.morning, ...marked.evening, ...marked.weekly].some((item) => item.doneOn === program.today) ||
        Boolean(program.navigator?.read);
      const week = program.week.map((day) => (day.day === program.today ? { ...day, done: todayDone } : day));
      return { status: "ready", program: { ...program, ...marked, week } };
    });
    return run(() =>
      Promise.all(
        practiceIds.map((id) =>
          request(`/api/program/practices/${encodeURIComponent(id)}`, { method: "POST", body: JSON.stringify({ done }) }),
        ),
      ),
    );
  };

  return {
    state,
    actionError,
    companionScreen,
    markCompanionSeen,
    setDone,
    markWelcomeVideoSeen: () => run(() => request("/api/program/welcome-video", { method: "POST" })),
  };
}
