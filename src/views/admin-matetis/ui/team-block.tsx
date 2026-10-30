"use client";

import { useState } from "react";

import { request } from "@/shared/api/request";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NativeSelect } from "@/shared/ui/native-select";

type Role = "user" | "content_manager" | "admin";

/**
 * Роль в команде в карточке Матэтиса. Ученика можно сделать контент-менеджером или админом —
 * с паролем для входа в админку. Члену команды — сменить роль или задать новый пароль.
 */
export function TeamBlock({ email, role, onChanged }: { email: string; role: Role; onChanged: () => void }) {
  const [nextRole, setNextRole] = useState<Role>(role);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const inTeam = role !== "user";
  const needsPassword = !inTeam && nextRole !== "user";

  async function run(path: string, body: Record<string, unknown>, done: string) {
    setPending(true);
    setMessage(null);
    try {
      await request(path, { method: "POST", body: JSON.stringify({ email, ...body }) });
      setPassword("");
      setMessage({ ok: true, text: done });
      onChanged();
    } catch (runError) {
      setMessage({ ok: false, text: (runError as Error).message });
    } finally {
      setPending(false);
    }
  }

  function saveRole() {
    if (nextRole === "user" && !window.confirm(`${email} больше не сможет войти в админку. Продолжить?`)) return;
    void run("/api/admin/staff", { role: nextRole, ...(needsPassword ? { password } : {}) }, "Роль сохранена");
  }

  return (
    <section className="space-y-3 border-t pt-4">
      <h2 className="font-semibold">Команда</h2>
      <div className="space-y-1.5">
        <Label htmlFor="team-role">Роль</Label>
        <NativeSelect
          id="team-role"
          className="h-11"
          value={nextRole}
          onChange={(event) => setNextRole(event.target.value as Role)}
        >
          <option value="user">Ученик</option>
          <option value="content_manager">Контент-менеджер</option>
          <option value="admin">Администратор</option>
        </NativeSelect>
      </div>
      {needsPassword && (
        <div className="space-y-1.5">
          <Label htmlFor="team-password">Пароль для входа в админку (не короче 8 знаков)</Label>
          <Input
            id="team-password"
            autoComplete="off"
            className="h-11"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
      )}
      {nextRole !== role && (
        <Button className="h-11 w-full" disabled={pending} onClick={saveRole}>
          Сохранить роль
        </Button>
      )}
      {inTeam && nextRole === role && (
        <Button
          variant="outline"
          className="h-11 w-full"
          disabled={pending}
          onClick={() => {
            const next = window.prompt(`Новый пароль для ${email} (не короче 8 знаков)`);
            if (next) void run("/api/admin/staff/password", { password: next }, "Пароль изменён");
          }}
        >
          Задать новый пароль
        </Button>
      )}
      {message && (
        <p role={message.ok ? undefined : "alert"} className={message.ok ? "text-sm text-primary" : "text-sm text-destructive"}>
          {message.text}
        </p>
      )}
    </section>
  );
}
