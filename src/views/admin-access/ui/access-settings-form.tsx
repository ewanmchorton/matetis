"use client";

import { useEffect, useState, type FormEvent } from "react";

import { request } from "@/shared/api/request";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type Settings = {
  adminPhone: string;
  adminTelegram: string;
  firstMonthCents: number;
  monthCents: number;
  threeMonthsCents: number;
};

const prices = [
  { key: "firstMonthCents", label: "Первый месяц, €" },
  { key: "monthCents", label: "Месяц, €" },
  { key: "threeMonthsCents", label: "3 месяца, €" },
] as const;

/** Контакт администратора для экранов без доступа и цены, которые подставляются при продлении. */
export function AccessSettingsForm() {
  const [form, setForm] = useState<Record<keyof Settings, string> | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    request<Settings>("/api/admin/access/settings")
      .then((settings) =>
        setForm({
          adminPhone: settings.adminPhone,
          adminTelegram: settings.adminTelegram,
          firstMonthCents: String(settings.firstMonthCents / 100),
          monthCents: String(settings.monthCents / 100),
          threeMonthsCents: String(settings.threeMonthsCents / 100),
        }),
      )
      .catch((error: Error) => setMessage({ text: error.message, error: true }));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    const cents = (value: string) => Math.round(Number(value.replace(",", ".")) * 100);
    setPending(true);
    setMessage(null);
    try {
      await request("/api/admin/access/settings", {
        method: "PATCH",
        body: JSON.stringify({
          adminPhone: form.adminPhone,
          adminTelegram: form.adminTelegram,
          firstMonthCents: cents(form.firstMonthCents),
          monthCents: cents(form.monthCents),
          threeMonthsCents: cents(form.threeMonthsCents),
        }),
      });
      setMessage({ text: "Сохранено", error: false });
    } catch (error) {
      setMessage({ text: (error as Error).message, error: true });
    } finally {
      setPending(false);
    }
  }

  const field = (key: keyof Settings) => ({
    value: form?.[key] ?? "",
    onChange: (event: { target: { value: string } }) => form && setForm({ ...form, [key]: event.target.value }),
  });

  return (
    <form className="space-y-4" onSubmit={save}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="admin-phone">Телефон (виден людям, Viber)</Label>
          <Input id="admin-phone" inputMode="tel" {...field("adminPhone")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin-telegram">Ник в Telegram (не виден, для готового сообщения)</Label>
          <Input id="admin-telegram" {...field("adminTelegram")} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {prices.map((price) => (
          <div key={price.key} className="space-y-1.5">
            <Label htmlFor={price.key}>{price.label}</Label>
            <Input id={price.key} inputMode="decimal" {...field(price.key)} />
          </div>
        ))}
      </div>
      {message && (
        <p role={message.error ? "alert" : "status"} className={message.error ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {message.text}
        </p>
      )}
      <Button type="submit" disabled={!form || pending}>
        Сохранить
      </Button>
    </form>
  );
}
