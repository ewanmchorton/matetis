"use client";

import { useCallback, useEffect, useState } from "react";

import { loadMyProgram } from "@/entities/program";
import type { MyProgram } from "@/entities/program/server";
import { request } from "@/shared/api/request";
import { isStaticPrototype } from "@/shared/config/env";

export type ProgramState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; program: MyProgram };

/** Программа на сегодня и действия с ней: отметки практик, просмотр видео. */
export function useMyProgram() {
  const [state, setState] = useState<ProgramState>({ status: "loading" });
  const [actionError, setActionError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setState({ status: "ready", program: await loadMyProgram() });
    } catch (loadError) {
      setState({ status: "error", message: (loadError as Error).message });
    }
  }, []);

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
      // Буква дня закрашивается, если сегодня отмечена хоть одна практика или прочитан навигатор — как на сервере.
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
    setDone,
    markWelcomeVideoSeen: () => run(() => request("/api/program/welcome-video", { method: "POST" })),
  };
}
