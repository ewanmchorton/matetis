// Доступ так, как он приходит с сервера в браузер: даты — строками.
// Серверные типы — в ../api/access.server.ts.

export type AccessStatusDto =
  | { kind: "staff" }
  | { kind: "active"; until: string; daysLeft: number; expiring: boolean }
  | { kind: "expired"; endedAt: string }
  | { kind: "request" }
  | { kind: "none" };

/** Ответ GET /api/access. */
export type MyAccess = {
  status: AccessStatusDto;
  /** Почта, @ник или tg:номер в Telegram — для готового сообщения администратору. */
  contact: string | null;
  adminPhone: string;
  adminTelegram: string;
};

export type AccessPeriodDto = {
  startsAt: string;
  endsAt: string;
  amountCents: number;
  currency: string;
  method: "manual";
  createdAt: string;
};

/** contact — почта, @ник или tg:номер в Telegram. */
export type AccessListItemDto = { contact: string; name: string | null; status: AccessStatusDto };

export type AccessCardDto = AccessListItemDto & {
  periods: AccessPeriodDto[];
  suggestedAmounts: Record<"1" | "3" | "12", number | null>;
};

export function hasAccessNow(status: AccessStatusDto): boolean {
  return status.kind === "staff" || status.kind === "active";
}
