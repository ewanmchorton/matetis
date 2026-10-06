"use client";

import { createId, createLocalStore } from "@/shared/lib/create-local-store";

import { getPerson, people } from "../model/people";
import type { Friendship, Invitation, SocialState } from "../model/types";

const seed: SocialState = {
  shareActivity: true,
  relations: {
    marina: "friend",
    igor: "friend",
    svetlana: "friend",
    denis: "friend",
    olga: "incoming",
    pavel: "none",
  },
  reactions: {},
  invitations: [
    {
      id: "inv-marina",
      practiceId: "water-inner-smile",
      practiceTitle: "Внутренняя улыбка",
      friendId: "marina",
      direction: "outgoing",
      status: "accepted",
      myDone: false,
      theirDone: true,
    },
    {
      id: "inv-igor",
      practiceId: "water-inner-smile",
      practiceTitle: "Внутренняя улыбка",
      friendId: "igor",
      direction: "incoming",
      status: "pending",
      myDone: false,
      theirDone: false,
    },
  ],
};

const store = createLocalStore<SocialState>("matetis-demo-social-v1", seed);

export function useSocial(): SocialState {
  return store.useStore();
}

function relationOf(state: SocialState, personId: string): Friendship {
  return state.relations[personId] ?? "none";
}

export function useFriendship(personId: string): Friendship {
  const { relations } = useSocial();
  return relations[personId] ?? "none";
}

export const socialActions = {
  setShareActivity(shareActivity: boolean) {
    store.update((state) => ({ ...state, shareActivity }));
  },
  sendRequest(personId: string) {
    store.update((state) => {
      if (relationOf(state, personId) !== "none") return state;
      return { ...state, relations: { ...state.relations, [personId]: "outgoing" } };
    });
  },
  acceptRequest(personId: string) {
    store.update((state) => {
      if (relationOf(state, personId) !== "incoming") return state;
      return { ...state, relations: { ...state.relations, [personId]: "friend" } };
    });
  },
  declineRequest(personId: string) {
    store.update((state) => ({ ...state, relations: { ...state.relations, [personId]: "none" } }));
  },
  removeFriend(personId: string) {
    store.update((state) => ({ ...state, relations: { ...state.relations, [personId]: "none" } }));
  },
  toggleReaction(eventId: string) {
    store.update((state) => ({
      ...state,
      reactions: { ...state.reactions, [eventId]: !state.reactions[eventId] },
    }));
  },
  sendInvite(friendId: string, practiceId: string, practiceTitle: string) {
    store.update((state) => {
      if (relationOf(state, friendId) !== "friend") return state;
      const person = getPerson(friendId);
      if (person?.unavailablePracticeIds.includes(practiceId)) return state;
      const exists = state.invitations.some(
        (item) => item.friendId === friendId && item.practiceId === practiceId && item.status !== "declined",
      );
      if (exists) return state;
      const invitation: Invitation = {
        id: createId("inv"),
        practiceId,
        practiceTitle,
        friendId,
        direction: "outgoing",
        status: "pending",
        myDone: false,
        theirDone: false,
      };
      return { ...state, invitations: [...state.invitations, invitation] };
    });
  },
  respondInvite(id: string, accept: boolean) {
    store.update((state) => ({
      ...state,
      invitations: state.invitations.map((item) =>
        item.id === id ? { ...item, status: accept ? "accepted" : "declined" } : item,
      ),
    }));
  },
  /** Возвращает новое значение «я выполнил». */
  toggleMyPart(id: string): boolean {
    let next = false;
    store.update((state) => ({
      ...state,
      invitations: state.invitations.map((item) => {
        if (item.id !== id) return item;
        next = !item.myDone;
        return { ...item, myDone: next };
      }),
    }));
    return next;
  },
  syncMyPart(practiceId: string, done: boolean) {
    store.update((state) => ({
      ...state,
      invitations: state.invitations.map((item) =>
        item.status === "accepted" && item.practiceId === practiceId ? { ...item, myDone: done } : item,
      ),
    }));
  },
  reset() {
    store.reset();
  },
};

export function listPeople() {
  return people;
}
