"use client";

import { useEffect, useState } from "react";

import { request, type RequestError } from "@/shared/api/request";
import { isDevelopment, isStaticPrototype } from "@/shared/config/env";

import { demoJournal, type JournalNote } from "../model/journal";

export type JournalState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "error"; message: string }
  | { status: "ready"; notes: JournalNote[] };

/** Свои заметки журнала. На GitHub Pages и без входа при разработке – тестовые записи. */
export function useJournal() {
  const [state, setState] = useState<JournalState>({ status: "loading" });

  useEffect(() => {
    // На GitHub Pages сервера нет: записи заданы заранее.
    if (isStaticPrototype) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ status: "ready", notes: demoJournal });
      return;
    }
    request<{ notes: JournalNote[] }>("/api/profile/journal")
      .then((data) => setState({ status: "ready", notes: data.notes }))
      .catch((error: RequestError) => {
        if (error.status === 401) {
          setState(isDevelopment ? { status: "ready", notes: demoJournal } : { status: "signed-out" });
        } else {
          setState({ status: "error", message: error.message });
        }
      });
  }, []);

  return state;
}
