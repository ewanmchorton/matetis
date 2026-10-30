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

type Filter = "all" | "request" | "expiring" | "expired" | "team";

const filters: { id: Filter; label: string; match: (item: AccessListItemDto) => boolean }[] = [
  { id: "all", label: "Все", match: () => true },
  { id: "request", label: "Заявки", match: (item) => item.status.kind === "request" },
  { id: "expiring", label: "Скоро", match: (item) => item.status.kind === "active" && item.status.expiring },
  { id: "expired", label: "Закончился", match: (item) => item.status.kind === "expired" },
  { id: "team", label: "Команда", match: (item) => item.status.kind === "staff" },
];

type TeamMember = { email: string; name: string };

type ListState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; items: AccessListItemDto[] };

/**
 * Раздел «Матэтисы»: все люди — ученики с доступами и команда. Удобен с телефона.
 * Добавить почту, найти человека, открыть его карточку.
 */
export function AdminMatetisPage() {
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [newContact, setNewContact] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [openContact, setOpenContact] = useState<string | null>(null);

  const load = useCallback(() => {
    if (isStaticPrototype) return;
    Promise.all([request<AccessListItemDto[]>("/api/admin/access"), request<TeamMember[]>("/api/admin/staff")])
      .then(([items, team]) => {
        const teamItems: AccessListItemDto[] = team.map((member) => ({
          contact: member.email,
          name: member.name || null,
          status: { kind: "staff" },
        }));
        // У члена команды могут остаться записи о доступе с тех пор, как он был учеником: показываем его один раз.
        const teamContacts = new Set(teamItems.map((item) => item.contact));
        setState({ status: "ready", items: [...teamItems, ...items.filter((item) => !teamContacts.has(item.contact))] });
      })
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
    const contact = newContact.trim().toLowerCase();
    // Окончательно почту и ник проверяет сервер, когда открывает карточку.
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const isTelegram = /^@?[a-z0-9_]{5,32}$/.test(contact);
    if (!isEmail && !isTelegram) return setAddError("Введите почту или ник в Telegram");
    setAddError(null);
    setNewContact("");
    setOpenContact(contact);
  }

  if (isStaticPrototype) {
    return (
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Матэтисы</h1>
        <p className="text-sm text-muted-foreground">На этом сайте нет сервера: доступы открываются в рабочем приложении.</p>
      </div>
    );
  }

  if (openContact) {
    return <AccessCard contact={openContact} onBack={() => setOpenContact(null)} onChanged={load} />;
  }

  const items = state.status === "ready" ? state.items : [];
  const query = search.trim().toLowerCase();
  const visible = items
    .filter(filters.find((item) => item.id === filter)!.match)
    .filter((item) => !query || item.contact.includes(query) || item.name?.toLowerCase().includes(query));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold">Матэтисы</h1>

      <PushToggle />

      <form className="flex gap-2" onSubmit={add} noValidate>
        <Input
          type="text"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          aria-label="Почта или ник в Telegram нового участника"
          placeholder="почта или @ник в Telegram"
          className="h-11 flex-1"
          value={newContact}
          onChange={(event) => setNewContact(event.target.value)}
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
            <li key={item.contact}>
              <button
                type="button"
                onClick={() => setOpenContact(item.contact)}
                className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{item.name || item.contact}</span>
                  {item.name && <span className="block truncate text-xs text-muted-foreground">{item.contact}</span>}
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
