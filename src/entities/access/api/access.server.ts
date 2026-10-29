// Доступ по подписке: статус человека, продление, закрытие и настройки. Только серверный код.
// Периоды и настройки видит и меняет только администратор. Сам человек видит свой статус.
// Проверку входа делает вызывающий код.
import { and, desc, eq, gt, sql, type SQL } from "drizzle-orm";

import { assertAdmin } from "@/shared/auth/assert-admin";
import { contactOf, normalizeContact, type ContactPerson } from "@/shared/auth/contact";
import { isStaff } from "@/shared/auth/roles";
import { accessPeriod, accessSettings, db, typeTestAttempt, user } from "@/shared/db";
import { AppError } from "@/shared/lib/app-error";

/** За сколько дней до окончания доступ считается «скоро закончится». */
export const EXPIRING_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export type AccessStatus =
  /** Администратор или контент-менеджер: доступ есть всегда. */
  | { kind: "staff" }
  /** Доступ идёт до until. expiring — осталось EXPIRING_DAYS дней или меньше. */
  | { kind: "active"; until: Date; daysLeft: number; expiring: boolean }
  | { kind: "expired"; endedAt: Date }
  /** Зарегистрирован и прошёл тест, а доступ ещё не открывали. */
  | { kind: "request" }
  /** Доступ не открывали, теста нет. */
  | { kind: "none" };

type PeriodDates = { startsAt: Date; endsAt: Date };

export type AccessPeriod = PeriodDates & {
  amountCents: number;
  currency: string;
  method: "manual";
  createdAt: Date;
};

export type AccessSettings = {
  adminPhone: string;
  /** Ник в Telegram без @. Пустой — Telegram открывается по телефону. */
  adminTelegram: string;
  firstMonthCents: number;
  monthCents: number;
  threeMonthsCents: number;
};

/** Сроки продления с кнопок карточки. «До даты» передаётся отдельно. */
export const ACCESS_TERMS = [1, 3, 12] as const;
export type AccessTerm = (typeof ACCESS_TERMS)[number];

/** Подставленная сумма для каждого срока. null — цены нет, сумму вводит админ. */
export type SuggestedAmounts = Record<AccessTerm, number | null>;

/** Статус по периодам одного человека. Без теста и роли: их учитывает вызывающий код. */
export function statusFromPeriods(periods: PeriodDates[], now: Date): AccessStatus {
  const current = periods.find((period) => period.startsAt <= now && now < period.endsAt);
  if (current) {
    // Продления идут встык, поэтому доступ длится до конца последнего примыкающего периода.
    let until = current.endsAt;
    for (let extended = true; extended; ) {
      extended = false;
      for (const period of periods) {
        if (period.startsAt <= until && period.endsAt > until) {
          until = period.endsAt;
          extended = true;
        }
      }
    }
    const left = until.getTime() - now.getTime();
    return { kind: "active", until, daysLeft: Math.ceil(left / DAY_MS), expiring: left <= EXPIRING_DAYS * DAY_MS };
  }
  const ended = periods.filter((period) => period.endsAt <= now);
  if (ended.length === 0) return { kind: "none" };
  return { kind: "expired", endedAt: new Date(Math.max(...ended.map((period) => period.endsAt.getTime()))) };
}

/** Та же дата через months месяцев. 31 января + 1 месяц = 28 (29) февраля. */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

function suggestAmounts(settings: AccessSettings, isFirst: boolean): SuggestedAmounts {
  // Первый период — цена первого месяца. На 3 и 12 месяцев сразу цены нет.
  if (isFirst) return { 1: settings.firstMonthCents, 3: null, 12: null };
  return { 1: settings.monthCents, 3: settings.threeMonthsCents, 12: null };
}

async function periodsOf(contact: string | null): Promise<AccessPeriod[]> {
  if (!contact) return [];
  return db
    .select({
      startsAt: accessPeriod.startsAt,
      endsAt: accessPeriod.endsAt,
      amountCents: accessPeriod.amountCents,
      currency: accessPeriod.currency,
      method: accessPeriod.method,
      createdAt: accessPeriod.createdAt,
    })
    .from(accessPeriod)
    .where(eq(accessPeriod.contact, contact))
    .orderBy(desc(accessPeriod.startsAt), desc(accessPeriod.createdAt));
}

async function hasTakenTest(personId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: typeTestAttempt.id })
    .from(typeTestAttempt)
    .where(eq(typeTestAttempt.userId, personId))
    .limit(1);
  return Boolean(row);
}

async function readSettings(): Promise<AccessSettings> {
  const [row] = await db
    .select({
      adminPhone: accessSettings.adminPhone,
      adminTelegram: accessSettings.adminTelegram,
      firstMonthCents: accessSettings.firstMonthCents,
      monthCents: accessSettings.monthCents,
      threeMonthsCents: accessSettings.threeMonthsCents,
    })
    .from(accessSettings)
    .limit(1);
  if (!row) throw new Error("Нет записи access_settings: примените миграции");
  return row;
}

type Viewer = ContactPerson & { id: string; role?: string | null };

async function statusOf(viewer: Viewer, now: Date): Promise<AccessStatus> {
  if (isStaff(viewer.role)) return { kind: "staff" };
  const status = statusFromPeriods(await periodsOf(contactOf(viewer)), now);
  if (status.kind === "none" && (await hasTakenTest(viewer.id))) return { kind: "request" };
  return status;
}

/** Есть ли у человека доступ к платной части приложения. */
export async function hasAccess(viewer: Viewer, now = new Date()): Promise<boolean> {
  const status = await statusOf(viewer, now);
  return status.kind === "staff" || status.kind === "active";
}

/** Свой статус, свой контакт (почта или ник в Telegram) и контакт администратора — для экранов без доступа и готового сообщения. */
export async function getMyAccess(viewer: Viewer, now = new Date()) {
  const [status, settings] = await Promise.all([statusOf(viewer, now), readSettings()]);
  return {
    status,
    contact: contactOf(viewer),
    adminPhone: settings.adminPhone,
    adminTelegram: settings.adminTelegram,
  };
}

export type AccessListItem = {
  /** Почта, @ник или tg:номер в Telegram. */
  contact: string;
  /** null — контакт добавили заранее, человек ещё не зарегистрировался. */
  name: string | null;
  status: AccessStatus;
};

// Сначала то, что ждёт действия: заявки, скоро закончится, закончился; потом остальные.
function attentionOrder(status: AccessStatus): number {
  if (status.kind === "request") return 0;
  if (status.kind === "active") return status.expiring ? 1 : 3;
  if (status.kind === "expired") return 2;
  return 4;
}

function statusTime(status: AccessStatus): number {
  if (status.kind === "active") return status.until.getTime();
  if (status.kind === "expired") return -status.endedAt.getTime();
  return 0;
}

/**
 * Все люди для раздела «Доступы»: зарегистрированные (кроме сотрудников) и контакты, добавленные заранее.
 * search — часть почты, ника или имени.
 */
export async function listAccessForAdmin(adminId: string, search = "", now = new Date()): Promise<AccessListItem[]> {
  await assertAdmin(adminId);
  return listAccessItems(search, now);
}

/** То же без проверки роли — для серверных задач (ежедневная сводка). */
export async function listAccessItems(search = "", now = new Date()): Promise<AccessListItem[]> {
  const [people, testTakers, periods] = await Promise.all([
    db
      .select({ id: user.id, name: user.name, email: user.email, telegramId: user.telegramId, telegramUsername: user.telegramUsername })
      .from(user)
      .where(eq(user.role, "user")),
    db.selectDistinct({ userId: typeTestAttempt.userId }).from(typeTestAttempt),
    db.select({ contact: accessPeriod.contact, startsAt: accessPeriod.startsAt, endsAt: accessPeriod.endsAt }).from(accessPeriod),
  ]);

  const tested = new Set(testTakers.map((row) => row.userId));
  const periodsByContact = new Map<string, PeriodDates[]>();
  for (const period of periods) {
    periodsByContact.set(period.contact, [...(periodsByContact.get(period.contact) ?? []), period]);
  }

  const items = new Map<string, AccessListItem>();
  for (const person of people) {
    const contact = contactOf(person);
    if (!contact) continue;
    let status = statusFromPeriods(periodsByContact.get(contact) ?? [], now);
    if (status.kind === "none" && tested.has(person.id)) status = { kind: "request" };
    items.set(contact, { contact, name: person.name, status });
  }
  for (const [contact, contactPeriods] of periodsByContact) {
    if (!items.has(contact)) items.set(contact, { contact, name: null, status: statusFromPeriods(contactPeriods, now) });
  }

  const query = search.trim().toLowerCase();
  return [...items.values()]
    .filter((item) => !query || item.contact.includes(query) || item.name?.toLowerCase().includes(query))
    .sort(
      (a, b) =>
        attentionOrder(a.status) - attentionOrder(b.status) ||
        statusTime(a.status) - statusTime(b.status) ||
        a.contact.localeCompare(b.contact),
    );
}

export type AccessCard = AccessListItem & {
  /** Новые сверху. */
  periods: AccessPeriod[];
  suggestedAmounts: SuggestedAmounts;
};

/** Условие поиска человека по контакту: почта, ник или номер в Telegram. */
function personByContact(contact: string): SQL {
  if (contact.startsWith("tg:")) return eq(user.telegramId, contact.slice(3));
  if (contact.startsWith("@")) return eq(user.telegramUsername, contact.slice(1));
  return sql`lower(${user.email}) = ${contact}`;
}

async function cardOf(contact: string, now: Date): Promise<AccessCard> {
  const [periods, [person], settings] = await Promise.all([
    periodsOf(contact),
    db
      .select({ id: user.id, name: user.name, role: user.role })
      .from(user)
      .where(personByContact(contact))
      .limit(1),
    readSettings(),
  ]);
  let status = isStaff(person?.role) ? ({ kind: "staff" } as const) : statusFromPeriods(periods, now);
  if (person && status.kind === "none" && (await hasTakenTest(person.id))) status = { kind: "request" };
  return {
    contact,
    name: person?.name ?? null,
    status,
    periods,
    suggestedAmounts: suggestAmounts(settings, periods.length === 0),
  };
}

/** Карточка человека: статус, история оплат и суммы для кнопок продления. */
export async function getAccessCardForAdmin(adminId: string, rawContact: unknown, now = new Date()) {
  await assertAdmin(adminId);
  return cardOf(normalizeContact(rawContact), now);
}

export type ExtendAccessInput = {
  /** 1, 3 или 12 месяцев. */
  months?: unknown;
  /** «До даты»: дата окончания вместо срока. */
  until?: unknown;
  /** Сумма в евроцентах. Не передана — подставляется по ценам из настроек. */
  amountCents?: unknown;
};

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" && !(value instanceof Date)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Открыть или продлить доступ. Идущий доступ продлевается с даты окончания,
 * закончившийся или новый — с текущего момента. Почту или ник можно добавить до регистрации.
 */
export async function extendAccess(adminId: string, rawContact: unknown, input: ExtendAccessInput, now = new Date()) {
  await assertAdmin(adminId);
  const contact = normalizeContact(rawContact);
  const card = await cardOf(contact, now);
  const startsAt = card.status.kind === "active" ? card.status.until : now;

  let endsAt: Date;
  let term: AccessTerm | null = null;
  if (input.until !== undefined && input.until !== null) {
    const until = parseDate(input.until);
    if (!until) throw new AppError("invalid_until", "Укажите дату окончания");
    if (until <= startsAt) {
      throw new AppError("invalid_until", `Дата окончания должна быть позже ${startsAt.toLocaleDateString("ru-RU")}`);
    }
    endsAt = until;
  } else {
    term = ACCESS_TERMS.find((months) => months === input.months) ?? null;
    if (!term) throw new AppError("invalid_term", "Выберите срок: 1, 3 или 12 месяцев");
    endsAt = addMonths(startsAt, term);
  }

  let amountCents: number | null = term ? card.suggestedAmounts[term] : null;
  if (input.amountCents !== undefined && input.amountCents !== null) {
    if (typeof input.amountCents !== "number" || !Number.isInteger(input.amountCents) || input.amountCents < 0) {
      throw new AppError("invalid_amount", "Сумма — целое число не меньше нуля");
    }
    amountCents = input.amountCents;
  }
  if (amountCents === null) throw new AppError("amount_required", "Укажите сумму");

  await db.insert(accessPeriod).values({ contact, startsAt, endsAt, amountCents, createdBy: adminId });
  return cardOf(contact, now);
}

/** Закрыть доступ сейчас. Периоды не удаляются: история оплат остаётся. */
export async function closeAccess(adminId: string, rawContact: unknown, now = new Date()) {
  await assertAdmin(adminId);
  const contact = normalizeContact(rawContact);
  // Будущие периоды (продление поверх идущего) тоже прекращаются: становятся нулевой длины.
  await db
    .update(accessPeriod)
    .set({ endsAt: sql`greatest(${accessPeriod.startsAt}, ${now})` })
    .where(and(eq(accessPeriod.contact, contact), gt(accessPeriod.endsAt, now)));
  return cardOf(contact, now);
}

export async function getAccessSettingsForAdmin(adminId: string): Promise<AccessSettings> {
  await assertAdmin(adminId);
  return readSettings();
}

function priceOf(value: unknown, fallback: number): number {
  if (value === undefined) return fallback;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new AppError("invalid_price", "Цена — целое число не меньше нуля");
  }
  return value;
}

/** Изменить контакт администратора и цены. Не переданные поля остаются прежними. */
export async function updateAccessSettings(adminId: string, changes: Partial<Record<keyof AccessSettings, unknown>>) {
  await assertAdmin(adminId);
  const current = await readSettings();
  let adminPhone = current.adminPhone;
  if (changes.adminPhone !== undefined) {
    adminPhone = typeof changes.adminPhone === "string" ? changes.adminPhone.replace(/[^\d+]/g, "") : "";
    if (!/^\+\d{7,15}$/.test(adminPhone)) throw new AppError("invalid_phone", "Телефон — в формате +375291234567");
  }
  let adminTelegram = current.adminTelegram;
  if (changes.adminTelegram !== undefined) {
    adminTelegram = typeof changes.adminTelegram === "string" ? changes.adminTelegram.trim().replace(/^@/, "") : "";
    if (adminTelegram && !/^[A-Za-z0-9_]{5,32}$/.test(adminTelegram)) {
      throw new AppError("invalid_telegram", "Ник в Telegram — латинские буквы, цифры и _, от 5 символов");
    }
  }
  const next: AccessSettings = {
    adminPhone,
    adminTelegram,
    firstMonthCents: priceOf(changes.firstMonthCents, current.firstMonthCents),
    monthCents: priceOf(changes.monthCents, current.monthCents),
    threeMonthsCents: priceOf(changes.threeMonthsCents, current.threeMonthsCents),
  };
  await db.update(accessSettings).set(next).where(eq(accessSettings.id, true));
  return next;
}
