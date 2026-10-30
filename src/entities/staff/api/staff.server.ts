// Сотрудники: роли и пароли для входа в админку. Только серверный код.
// В админку входят по почте и паролю. Пароль задаёт администратор, сотрудник может его поменять.
// Обычные люди входят по коду из письма или через Telegram, пароль у них не работает.
import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";
import { and, asc, eq, inArray } from "drizzle-orm";

import { assertAdmin } from "@/shared/auth/assert-admin";
import { isStaff, type PersonRole } from "@/shared/auth/roles";
import { account, db, user } from "@/shared/db";
import { AppError } from "@/shared/lib/app-error";

/** Пароль сотрудника хранится как у Better Auth: учётная запись «credential». */
const PASSWORD_PROVIDER = "credential";
export const PASSWORD_MIN_LENGTH = 8;

export type StaffMember = { id: string; name: string; email: string; role: PersonRole; hasPassword: boolean };

function normalizedEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function checkPassword(value: unknown): string {
  if (typeof value !== "string" || value.length < PASSWORD_MIN_LENGTH) {
    throw new AppError("short_password", `Пароль — не короче ${PASSWORD_MIN_LENGTH} знаков`);
  }
  return value;
}

/** Сохранить пароль человека: новый или вместо старого. */
export async function storePassword(userId: string, password: string) {
  const hash = await hashPassword(password);
  const updated = await db
    .update(account)
    .set({ password: hash, updatedAt: new Date() })
    .where(and(eq(account.userId, userId), eq(account.providerId, PASSWORD_PROVIDER)))
    .returning({ id: account.id });
  if (updated.length === 0) {
    await db.insert(account).values({
      id: randomUUID(),
      userId,
      accountId: userId,
      providerId: PASSWORD_PROVIDER,
      password: hash,
    });
  }
}

/** Все сотрудники: администраторы и контент-менеджеры. Только для администратора. */
export async function listStaffForAdmin(adminId: string): Promise<StaffMember[]> {
  await assertAdmin(adminId);
  const people = await db
    .select({ id: user.id, name: user.name, email: user.email, role: user.role })
    .from(user)
    .where(inArray(user.role, ["admin", "content_manager"]))
    .orderBy(asc(user.role), asc(user.email));
  const withPassword = new Set(
    (
      await db
        .select({ userId: account.userId })
        .from(account)
        .where(and(eq(account.providerId, PASSWORD_PROVIDER), inArray(account.userId, people.map((person) => person.id))))
    ).map((row) => row.userId),
  );
  return people.map((person) => ({
    ...person,
    email: person.email ?? "",
    role: person.role as PersonRole,
    hasPassword: withPassword.has(person.id),
  }));
}

/**
 * Назначить зарегистрированному человеку роль: администратор, контент-менеджер или обычный пользователь.
 * Новому сотруднику нужен пароль. Вернуть в пользователи — пароль удаляется, в админку он больше не войдёт.
 */
export async function setStaffRole(adminId: string, input: { email?: unknown; role?: unknown; password?: unknown }) {
  await assertAdmin(adminId);
  const role = input.role;
  if (role !== "admin" && role !== "content_manager" && role !== "user") {
    throw new AppError("invalid_role", "Выберите роль");
  }
  const email = normalizedEmail(input.email);
  const [person] = await db.select({ id: user.id, role: user.role }).from(user).where(eq(user.email, email));
  if (!person) throw new AppError("not_found", "Человек с такой почтой не зарегистрирован");
  if (person.id === adminId && role !== "admin") {
    throw new AppError("own_role", "Свою роль администратора снять нельзя");
  }

  if (role === "user") {
    await db.update(user).set({ role, updatedAt: new Date() }).where(eq(user.id, person.id));
    await db.delete(account).where(and(eq(account.userId, person.id), eq(account.providerId, PASSWORD_PROVIDER)));
    return { ok: true };
  }

  const [hasPassword] = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, person.id), eq(account.providerId, PASSWORD_PROVIDER)));
  if (!hasPassword && input.password === undefined) {
    throw new AppError("password_required", "Задайте пароль для входа в админку");
  }
  if (input.password !== undefined) await storePassword(person.id, checkPassword(input.password));
  await db.update(user).set({ role, updatedAt: new Date() }).where(eq(user.id, person.id));
  return { ok: true };
}

/** Новый пароль сотруднику, например если он забыл свой. */
export async function resetStaffPassword(adminId: string, input: { email?: unknown; password?: unknown }) {
  await assertAdmin(adminId);
  const [person] = await db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(eq(user.email, normalizedEmail(input.email)));
  if (!person || !isStaff(person.role)) throw new AppError("not_found", "Такого сотрудника нет");
  await storePassword(person.id, checkPassword(input.password));
  return { ok: true };
}

/** Можно ли войти по паролю с этой почтой: только сотрудникам. */
export async function canSignInWithPassword(email: unknown): Promise<boolean> {
  const [person] = await db.select({ role: user.role }).from(user).where(eq(user.email, normalizedEmail(email)));
  return isStaff(person?.role);
}
