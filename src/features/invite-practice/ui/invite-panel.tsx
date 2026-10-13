"use client";

import { useState } from "react";

import { allowsTogether, usePracticeCatalog } from "@/entities/practice";
import { getPerson, socialActions, useSocial } from "@/entities/social";
import { Button } from "@/shared/ui/button";

export function InvitePanel({
  presetPracticeId,
  onClose,
}: {
  presetPracticeId?: string;
  onClose: () => void;
}) {
  const { practices } = usePracticeCatalog();
  const { relations, invitations } = useSocial();
  const jointPractices = practices.filter(allowsTogether);
  const [practiceId, setPracticeId] = useState(presetPracticeId ?? jointPractices[0]?.id ?? "");
  const practice = jointPractices.find((item) => item.id === practiceId);
  const friends = Object.entries(relations)
    .filter(([, status]) => status === "friend")
    .map(([id]) => getPerson(id))
    .filter((person) => person !== undefined);

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">Предложить практику</p>
          <p className="mt-1 text-sm text-muted-foreground">Друг может принять или отклонить приглашение.</p>
        </div>
        <button type="button" className="text-sm text-muted-foreground underline-offset-4 hover:underline" onClick={onClose}>
          Закрыть
        </button>
      </div>

      {!presetPracticeId && (
        <div className="space-y-2">
          {jointPractices.map((item) => (
            <label key={item.id} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="invite-practice"
                checked={practiceId === item.id}
                onChange={() => setPracticeId(item.id)}
              />
              {item.title}
            </label>
          ))}
        </div>
      )}

      {presetPracticeId && practice && <p className="text-sm font-medium">{practice.title}</p>}

      <ul className="space-y-2">
        {friends.map((friend) => {
          const unavailable = practice ? friend.unavailablePracticeIds.includes(practice.id) : false;
          const already = invitations.some(
            (item) => item.friendId === friend.id && item.practiceId === practiceId && item.status !== "declined",
          );
          return (
            <li key={friend.id} className="flex items-center justify-between gap-3">
              <span className="text-sm">{friend.name}</span>
              {unavailable ? (
                <span className="text-xs text-muted-foreground">Нет в программе друга</span>
              ) : already ? (
                <span className="text-xs text-muted-foreground">Уже есть приглашение</span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!practice}
                  onClick={() => {
                    if (!practice) return;
                    socialActions.sendInvite(friend.id, practice.id, practice.title);
                  }}
                >
                  Пригласить
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
