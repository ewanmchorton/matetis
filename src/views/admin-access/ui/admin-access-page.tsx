"use client";

import { ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import type { AccessListItemDto } from "@/entities/access";
import { PushToggle } from "@/features/admin-notifications";
import { request } from "@/shared/api/request";
import { isStaticPrototype } from "@/shared/config/env";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import { AccessCard } from "./access-card";
import { AccessSettingsForm } from "./access-settings-form";
import { StatusBadge } from "./status-badge";

type Filter = "all" | "request" | "expiring" | "expired";

const filters: { id: Filter; label: string; match: (item: AccessListItemDto) => boolean }[] = [
  { id: "all", label: "Все", match: () => true },
  { id: "request", label: "Заявки", match: (item) => item.status.kind === "request" },
  { id: "expiring", label: "Скоро", match: (item) => item.status.kind === "active" && item.status.expiring },
  { id: "expired", label: "Закончился", match: (item) => item.status.kind === "expired" },
];

type ListState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; items: AccessListItemDto[] };

/** Раздел «Доступы»: удобен с телефона. Добавить почту, найти человека, открыть его карточку. */
export function AdminAccessPage() {
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [openEmail, setOpenEmail] = useState<string | null>(null);

  const load = useCallback(() => {
    if (isStaticPrototype) return;
    request<AccessListItemDto[]>("/api/admin/access")
      .then((items) => setState({ status: "ready", items }))
      .catch((error: Error) => setState({ status: "error", message: error.message }));
  }, []);

  useEffect(load, [load]);

  // Из уведомления: ?filter=request — заявки, ?filter=expiring — скоро закончится.
  useEffect(() => {
    const fromLink = new URLSearchParams(window.location.search).get("filter");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (filters.some((item) => item.id === fromLink)) setFilter(fromLink as Filter);
  }, []);

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setAddError("Проверьте почту");
    setAddError(null);
    setNewEmail("");
    setOpenEmail(email);
  }

  if (isStaticPrototype) {
    return (
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Доступы</h1>
        <p className="text-sm text-muted-foreground">На этом сайте нет сервера: доступы открываются в рабочем приложении.</p>
      </div>
    );
  }

  if (openEmail) {
    return <AccessCard email={openEmail} onBack={() => setOpenEmail(null)} onChanged={load} />;
  }

  const items = state.status === "ready" ? state.items : [];
  const query = search.trim().toLowerCase();
  const visible = items
    .filter(filters.find((item) => item.id === filter)!.match)
    .filter((item) => !query || item.email.includes(query) || item.name?.toLowerCase().includes(query));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold">Доступы</h1>

      <PushToggle />

      <form className="flex gap-2" onSubmit={add} noValidate>
        <Input
          type="email"
          inputMode="email"
          aria-label="Почта нового участника"
          placeholder="почта@mail.ru"
          className="h-11 flex-1"
          value={newEmail}
          onChange={(event) => setNewEmail(event.target.value)}
        />
        <Button type="submit" className="h-11 px-4">
          Добавить
        </Button>
      </form>
      {addError && (
        <p role="alert" className="-mt-3 text-sm text-destructive">
          {addError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => {
          const count = items.filter(item.match).length;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
              className={cn(
                "min-h-9 rounded-full border px-3 text-sm",
                filter === item.id ? "border-primary bg-primary/10 text-primary" : "bg-background text-muted-foreground",
              )}
            >
              {item.label}
              {item.id !== "all" && count > 0 && ` ${count}`}
            </button>
          );
        })}
      </div>

      <Input
        type="search"
        aria-label="Поиск по почте или имени"
        placeholder="Поиск по почте или имени"
        className="h-11"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <section className="rounded-2xl border bg-background">
        {state.status === "loading" && <p className="p-4 text-sm text-muted-foreground">Загружаем…</p>}
        {state.status === "error" && (
          <p role="alert" className="p-4 text-sm text-destructive">
            {state.message}
          </p>
        )}
        {state.status === "ready" && visible.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">Никого нет.</p>
        )}
        <ul className="divide-y">
          {visible.map((item) => (
            <li key={item.email}>
              <button
                type="button"
                onClick={() => setOpenEmail(item.email)}
                className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{item.name || item.email}</span>
                  {item.name && <span className="block truncate text-xs text-muted-foreground">{item.email}</span>}
                </span>
                <StatusBadge status={item.status} />
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <details className="rounded-2xl border bg-background p-4">
        <summary className="cursor-pointer font-medium">Контакт и цены</summary>
        <div className="pt-4">
          <AccessSettingsForm />
        </div>
      </details>
    </div>
  );
}
