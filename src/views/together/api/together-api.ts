"use client";

import { useCallback, useEffect, useState } from "react";

import type { InviteOptions, Together } from "@/entities/together/server";
import { request, type RequestError } from "@/shared/api/request";
import { isDevelopment, isStaticPrototype } from "@/shared/config/env";
import { addDays, toDateKey } from "@/shared/lib/date";

import { demoOptions, demoTogether } from "../model/demo";

export type TogetherState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: Together; demo: boolean };

/** Данные вкладки «Вместе» и действия с ними. */
export function useTogether() {
  const [state, setState] = useState<TogetherState>({ status: "loading" });
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [asked, setAsked] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (isStaticPrototype) return setState({ status: "ready", data: demoTogether(), demo: true });
    try {
      setState({ status: "ready", data: await request<Together>("/api/together"), demo: false });
    } catch (error) {
      const status = (error as RequestError).status;
      if (status === 401 && isDevelopment) setState({ status: "ready", data: demoTogether(), demo: true });
      else setState({ status: "error", message: (error as Error).message });
    }
  }, []);

  useEffect(() => {
    // Загрузка с сервера при открытии экрана.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const demo = state.status === "ready" && state.demo;

  function update(change: (data: Together) => Together) {
    setState((current) => (current.status === "ready" ? { ...current, data: change(current.data) } : current));
  }

  async function run(path: string, body: unknown, change: (data: Together) => Together) {
    setActionError(null);
    if (demo) {
      update(change);
      return true;
    }
    setPending(true);
    try {
      await request(path, { method: "POST", body: JSON.stringify(body) });
      await load();
      return true;
    } catch (error) {
      setActionError((error as Error).message);
      return false;
    } finally {
      setPending(false);
    }
  }

  const card = state.status === "ready" ? state.data.card : null;

  function answer(accept: boolean) {
    if (!card || (card.kind !== "incoming" && card.kind !== "monthly")) return;
    const today = toDateKey(new Date());
    return run(`/api/together/${card.id}/answer`, { accept }, (data) => {
      if (!accept) return { ...data, card: null, canInvite: data.hasFriends };
      if (card.kind === "monthly" && !card.iAccepted) return { ...data, card: { ...card, iAccepted: true } };
      return {
        ...data,
        canInvite: false,
        card: {
          id: card.id,
          practice: card.practice,
          partner: card.partner,
          kind: "active",
          startsOn: today,
          endsOn: toDateKey(addDays(new Date(), 6)),
          myDone: false,
          partnerDone: false,
        },
      };
    });
  }

  function cancel() {
    if (!card || card.kind !== "outgoing") return;
    return run(`/api/together/${card.id}/cancel`, {}, (data) => ({ ...data, card: null, canInvite: data.hasFriends }));
  }

  function stop() {
    if (!card || card.kind !== "active") return;
    return run(`/api/together/${card.id}/stop`, {}, (data) => ({ ...data, card: null, canInvite: data.hasFriends }));
  }

  function dismiss() {
    if (!card || card.kind !== "completed") return;
    return run(`/api/together/${card.id}/dismiss`, {}, (data) => ({ ...data, card: null, canInvite: data.hasFriends }));
  }

  function mark(done: boolean) {
    if (!card || card.kind !== "active") return;
    return run(`/api/together/${card.id}/mark`, { done }, (data) => ({
      ...data,
      card: { ...card, myDone: done },
    }));
  }

  function support(eventId: string, on: boolean) {
    return run(`/api/together/events/${eventId}/support`, { on }, (data) => ({
      ...data,
      feed: data.feed.map((item) => (item.id === eventId ? { ...item, supported: on } : item)),
    }));
  }

  function invite(friendId: string, practiceId: string) {
    return run("/api/together/invitations", { friendId, practiceId }, (data) => {
      const options = demoOptions(friendId);
      const friend = options.friends.find((item) => item.id === friendId);
      const practice = options.practices.find((item) => item.id === practiceId);
      if (!friend || !practice) return data;
      return {
        ...data,
        canInvite: false,
        card: {
          id: "demo-outgoing",
          kind: "outgoing",
          answerBy: "2099-01-01T00:00:00.000Z",
          practice,
          partner: { id: friend.id, name: friend.name, companionStage: friend.companionStage, isFriend: true },
        },
      };
    });
  }

  async function addFriend(personId: string) {
    setActionError(null);
    if (demo) return setAsked((ids) => [...ids, personId]);
    setPending(true);
    try {
      await request(`/api/people/${personId}`, { method: "POST", body: JSON.stringify({ action: "send" }) });
      setAsked((ids) => [...ids, personId]);
      await load();
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes("уже отправлен")) setAsked((ids) => [...ids, personId]);
      else setActionError(message);
    } finally {
      setPending(false);
    }
  }

  const loadOptions = useCallback(
    (friendId?: string): Promise<InviteOptions> => {
      if (demo) return Promise.resolve(demoOptions(friendId));
      const query = friendId ? `?friendId=${encodeURIComponent(friendId)}` : "";
      return request<InviteOptions>(`/api/together/options${query}`);
    },
    [demo],
  );

  return {
    state,
    actionError,
    pending,
    asked,
    demo,
    answer,
    cancel,
    stop,
    dismiss,
    mark,
    support,
    invite,
    addFriend,
    loadOptions,
  };
}
