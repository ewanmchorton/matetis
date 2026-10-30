"use client";

import { useState, type FormEvent } from "react";

import { authClient } from "@/shared/auth/client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

const MIN_LENGTH = 8;

/** Сотрудник меняет свой пароль для входа в админку. */
export function AdminPasswordPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setDone(false);
    if (next.length < MIN_LENGTH) return setError(`Новый пароль — не короче ${MIN_LENGTH} знаков`);
    if (next !== repeat) return setError("Новые пароли не совпадают");
    setPending(true);
    const { error: changeError } = await authClient.changePassword({ currentPassword: current, newPassword: next });
    setPending(false);
    if (changeError) return setError("Текущий пароль неверный");
    setCurrent("");
    setNext("");
    setRepeat("");
    setDone(true);
  }

  return (
    <div className="mx-auto max-w-sm space-y-5">
      <h1 className="text-2xl font-semibold">Сменить пароль</h1>
      <form className="space-y-3 rounded-2xl border bg-background p-4" onSubmit={(event) => void save(event)}>
        <div className="space-y-1.5">
          <Label htmlFor="current-password">Текущий пароль</Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            required
            className="h-11"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-password">Новый пароль</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            className="h-11"
            value={next}
            onChange={(event) => setNext(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="repeat-password">Новый пароль ещё раз</Label>
          <Input
            id="repeat-password"
            type="password"
            autoComplete="new-password"
            required
            className="h-11"
            value={repeat}
            onChange={(event) => setRepeat(event.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {done && <p className="text-sm text-primary">Пароль изменён</p>}
        <Button type="submit" className="h-11 w-full" disabled={pending}>
          Сохранить
        </Button>
      </form>
    </div>
  );
}
