"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut } from "lucide-react";

import { progressActions } from "@/entities/progress";
import { routes } from "@/shared/config/routes";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PageHeader } from "@/shared/ui/page-header";

const reminders = [
  { id: "daily", label: "Напоминать о практике дня", hint: "каждый день в 9:00" },
  { id: "rituals", label: "Напоминать о ритуалах недели", hint: "в рекомендуемый день" },
  { id: "element", label: "Сообщать о смене стихии", hint: "за 3 дня" },
];

export function ProfileSettingsPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ daily: true, element: true });
  const [saved, setSaved] = useState(false);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Настройки" />

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <h2 className="font-semibold">Личные данные</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="s-name">Имя</Label>
            <Input id="s-name" defaultValue="Анна Смирнова" onChange={() => setSaved(false)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="s-email">E-mail</Label>
            <Input id="s-email" type="email" defaultValue="anna@example.ru" onChange={() => setSaved(false)} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setSaved(true)}>Сохранить</Button>
          {saved && <span className="text-sm text-primary">Сохранено</span>}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <div>
          <h2 className="font-semibold">Напоминания</h2>
          <p className="text-sm text-muted-foreground">
            Канал (push, e-mail или Telegram) пока уточняется.
          </p>
        </div>
        <ul className="space-y-3">
          {reminders.map((r) => (
            <li key={r.id}>
              <Label className="flex items-start gap-3 font-normal">
                <Checkbox
                  className="mt-0.5"
                  checked={enabled[r.id] ?? false}
                  onCheckedChange={(v) => setEnabled({ ...enabled, [r.id]: v === true })}
                />
                <span>
                  <span className="block text-sm font-medium">{r.label}</span>
                  <span className="block text-xs text-muted-foreground">{r.hint}</span>
                </span>
              </Label>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" onClick={() => progressActions.reset()}>
          Сбросить демо-отметки
        </Button>
        <Link href={routes.auth} className={buttonVariants({ variant: "outline" })}>
          <LogOut />
          Выйти
        </Link>
      </section>
    </div>
  );
}
