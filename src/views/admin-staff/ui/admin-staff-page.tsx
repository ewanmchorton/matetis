"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { request } from "@/shared/api/request";
import { isStaticPrototype } from "@/shared/config/env";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { NativeSelect } from "@/shared/ui/native-select";

type Role = "admin" | "content_manager" | "user";
type StaffMember = { id: string; name: string; email: string; role: Role; hasPassword: boolean };
type ListState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; staff: StaffMember[] };

const roleNames: Record<Role, string> = { admin: "Администратор", content_manager: "Контент-менеджер", user: "Ученик" };

/** Раздел «Команда»: назначить роль зарегистрированному человеку, задать или сбросить пароль. */
export function AdminStaffPage() {
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("content_manager");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    if (isStaticPrototype) return;
    request<StaffMember[]>("/api/admin/staff")
      .then((staff) => setState({ status: "ready", staff }))
      .catch((loadError: Error) => setState({ status: "error", message: loadError.message }));
  }, []);

  useEffect(load, [load]);

  async function run(action: () => Promise<unknown>, done: string) {
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      setNotice(done);
      load();
      return true;
    } catch (actionError) {
      setError((actionError as Error).message);
      return false;
    } finally {
      setPending(false);
    }
  }

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await run(
      () => request("/api/admin/staff", { method: "POST", body: JSON.stringify({ email, role, password }) }),
      `${email}: ${roleNames[role].toLowerCase()}`,
    );
    if (ok) {
      setEmail("");
      setPassword("");
    }
  }

  function changeRole(member: StaffMember, next: Role) {
    if (next === "user" && !window.confirm(`${member.email} больше не сможет войти в админку. Продолжить?`)) return;
    void run(
      () => request("/api/admin/staff", { method: "POST", body: JSON.stringify({ email: member.email, role: next }) }),
      `${member.email}: ${roleNames[next].toLowerCase()}`,
    );
  }

  function resetPassword(member: StaffMember) {
    const next = window.prompt(`Новый пароль для ${member.email} (не короче 8 знаков)`);
    if (!next) return;
    void run(
      () =>
        request("/api/admin/staff/password", {
          method: "POST",
          body: JSON.stringify({ email: member.email, password: next }),
        }),
      `Пароль для ${member.email} изменён`,
    );
  }

  if (isStaticPrototype) {
    return <h1 className="text-2xl font-semibold">Команда</h1>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Команда</h1>
        <p className="text-sm text-muted-foreground">
          Администратор и контент-менеджер входят в админку по почте и паролю. Пароль задаёт администратор, сотрудник
          может поменять его сам.
        </p>
      </div>

      <form className="space-y-3 rounded-2xl border bg-background p-4" onSubmit={(event) => void add(event)}>
        <p className="font-medium">Добавить в команду</p>
        <div className="space-y-1.5">
          <Label htmlFor="staff-email">Почта зарегистрированного человека</Label>
          <Input
            id="staff-email"
            type="email"
            required
            className="h-11"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="staff-role">Роль</Label>
          <NativeSelect
            id="staff-role"
            className="h-11"
            value={role}
            onChange={(event) => setRole(event.target.value as Role)}
          >
            <option value="content_manager">Контент-менеджер</option>
            <option value="admin">Администратор</option>
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="staff-password">Пароль для входа (не короче 8 знаков)</Label>
          <Input
            id="staff-password"
            type="text"
            autoComplete="off"
            required
            minLength={8}
            className="h-11"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <Button type="submit" className="h-11 w-full" disabled={pending}>
          Назначить
        </Button>
      </form>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && <p className="text-sm text-primary">{notice}</p>}

      <section className="rounded-2xl border bg-background">
        {state.status === "loading" && <p className="p-4 text-sm text-muted-foreground">Загружаем…</p>}
        {state.status === "error" && (
          <p role="alert" className="p-4 text-sm text-destructive">
            {state.message}
          </p>
        )}
        <ul className="divide-y">
          {state.status === "ready" &&
            state.staff.map((member) => (
              <li key={member.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{member.name || member.email}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {member.email}
                    {!member.hasPassword && " · пароль не задан"}
                  </span>
                </span>
                <NativeSelect
                  aria-label={`Роль ${member.email}`}
                  className="h-11 w-auto"
                  value={member.role}
                  disabled={pending}
                  onChange={(event) => changeRole(member, event.target.value as Role)}
                >
                  <option value="content_manager">Контент-менеджер</option>
                  <option value="admin">Администратор</option>
                  <option value="user">Ученик</option>
                </NativeSelect>
                <Button variant="outline" className="h-11" disabled={pending} onClick={() => resetPassword(member)}>
                  Новый пароль
                </Button>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
