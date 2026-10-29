"use client";

import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

import { formatDay, formatEuro, type AccessCardDto } from "@/entities/access";
import { request } from "@/shared/api/request";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { statusView } from "./status-badge";

type Term = "1" | "3" | "12" | "until";

const termButton: Record<Term, string> = {
  "1": "+1 месяц",
  "3": "+3 месяца",
  "12": "+12 месяцев",
  until: "Продлить до даты",
};

const otherTerms: { term: Term; label: string }[] = [
  { term: "3", label: "3 мес" },
  { term: "12", label: "12 мес" },
  { term: "until", label: "до даты" },
];

function centsToInput(cents: number | null | undefined) {
  return cents === null || cents === undefined ? "" : String(cents / 100);
}

/** Карточка человека: статус, «+1 месяц» крупно, другие сроки мелко, история оплат, «Закрыть доступ». */
/** contact — почта или ник в Telegram, как ввёл администратор или как пришло в списке. */
export function AccessCard({ contact, onBack, onChanged }: { contact: string; onBack: () => void; onChanged: () => void }) {
  const [card, setCard] = useState<AccessCardDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [term, setTerm] = useState<Term>("1");
  const [amount, setAmount] = useState("");
  const [until, setUntil] = useState("");

  useEffect(() => {
    request<AccessCardDto>("/api/admin/access/person", { method: "POST", body: JSON.stringify({ contact }) })
      .then((loaded) => {
        setCard(loaded);
        setAmount(centsToInput(loaded.suggestedAmounts["1"]));
      })
      .catch((loadError: Error) => setError(loadError.message));
  }, [contact]);

  function chooseTerm(next: Term) {
    setTerm(next);
    setError(null);
    setAmount(next === "until" || !card ? "" : centsToInput(card.suggestedAmounts[next]));
  }

  async function act(path: string, body: Record<string, unknown>) {
    setPending(true);
    setError(null);
    try {
      const updated = await request<AccessCardDto>(path, { method: "POST", body: JSON.stringify({ contact, ...body }) });
      setCard(updated);
      setTerm("1");
      setUntil("");
      setAmount(centsToInput(updated.suggestedAmounts["1"]));
      onChanged();
    } catch (actError) {
      setError((actError as Error).message);
    } finally {
      setPending(false);
    }
  }

  function extend() {
    const euros = Number(amount.replace(",", "."));
    if (amount.trim() === "" || !Number.isFinite(euros) || euros < 0) return setError("Укажите сумму");
    const amountCents = Math.round(euros * 100);
    if (term === "until") {
      if (!until) return setError("Укажите дату окончания");
      return act("/api/admin/access/periods", { until: new Date(`${until}T23:59:59`).toISOString(), amountCents });
    }
    return act("/api/admin/access/periods", { months: Number(term), amountCents });
  }

  function close() {
    if (!window.confirm(`Закрыть доступ для ${card?.contact ?? contact}? История оплат останется.`)) return;
    void act("/api/admin/access/close", {});
  }

  const status = card?.status;
  const tone = status ? statusView(status).className : "";

  return (
    <div className="mx-auto max-w-md space-y-5">
      <button type="button" onClick={onBack} className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" />
        Доступы
      </button>

      <div>
        <h1 className="text-xl font-semibold">{card?.name || card?.contact || contact}</h1>
        {card?.name && <p className="text-sm text-muted-foreground">{card.contact}</p>}
        {card && !card.name && <p className="text-sm text-muted-foreground">Ещё не зарегистрировался</p>}
      </div>

      {!card && !error && <p className="text-sm text-muted-foreground">Загружаем…</p>}

      {card && status && (
        <>
          <div className={cn("rounded-xl p-4", tone)}>
            {status.kind === "active" && (
              <>
                <p className="text-xs">Доступ до</p>
                <p className="text-lg font-semibold">
                  {formatDay(status.until)}
                  {status.expiring && ` · ${statusView(status).label}`}
                </p>
              </>
            )}
            {status.kind === "expired" && (
              <>
                <p className="text-xs">Доступ закончился</p>
                <p className="text-lg font-semibold">{formatDay(status.endedAt)}</p>
              </>
            )}
            {(status.kind === "request" || status.kind === "none" || status.kind === "staff") && (
              <p className="text-lg font-semibold first-letter:uppercase">{statusView(status).label}</p>
            )}
          </div>

          {status.kind !== "staff" && (
            <div className="space-y-3">
              {term === "until" && (
                <div className="space-y-1.5">
                  <Label htmlFor="access-until">Доступ до</Label>
                  <Input id="access-until" type="date" value={until} onChange={(event) => setUntil(event.target.value)} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="access-amount">Сумма, €</Label>
                <Input
                  id="access-amount"
                  inputMode="decimal"
                  value={amount}
                  placeholder="Введите сумму"
                  onChange={(event) => setAmount(event.target.value)}
                />
              </div>
              <Button className="h-12 w-full text-base" disabled={pending} onClick={() => void extend()}>
                {termButton[term]}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Другой срок:{" "}
                {(term === "1" ? otherTerms : [{ term: "1" as Term, label: "1 мес" }, ...otherTerms.filter((item) => item.term !== term)]).map(
                  (item, index) => (
                    <span key={item.term}>
                      {index > 0 && " · "}
                      <button
                        type="button"
                        className="min-h-11 text-primary underline-offset-4 hover:underline"
                        onClick={() => chooseTerm(item.term)}
                      >
                        {item.label}
                      </button>
                    </span>
                  ),
                )}
              </p>
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          {card.periods.length > 0 && (
            <div className="space-y-2 border-t pt-4 text-sm">
              <p className="text-muted-foreground">История</p>
              <ul className="space-y-1.5">
                {card.periods.map((period) => (
                  <li key={`${period.startsAt}-${period.createdAt}`} className="flex justify-between gap-3">
                    <span>
                      {formatDay(period.startsAt)} — {formatDay(period.endsAt)}
                    </span>
                    <span className="text-muted-foreground">{formatEuro(period.amountCents)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {status.kind === "active" && (
            <Button variant="ghost" className="w-full text-destructive" disabled={pending} onClick={close}>
              Закрыть доступ
            </Button>
          )}
        </>
      )}
      {!card && error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
