// Роли людей. Совпадают с person_role в src/shared/db/schema/auth.ts.
// Без обращений к базе, поэтому подходит и для экранов.

export const personRoles = ["user", "content_manager", "admin"] as const;
export type PersonRole = (typeof personRoles)[number];

/** Сотрудник: входит в админку и пользуется приложением без подписки. */
export function isStaff(role: string | null | undefined): boolean {
  return role === "admin" || role === "content_manager";
}
