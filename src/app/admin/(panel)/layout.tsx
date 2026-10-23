import type { PersonRole } from "@/shared/auth/roles";
import { getCurrentUser, isStaticPrototype, requireAdminPage } from "@/shared/auth/session";
import { AdminShell } from "@/widgets/admin-shell";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  // В прототипе для Pages входа нет: показываем админку как администратору.
  const role: PersonRole = isStaticPrototype ? "admin" : ((await getCurrentUser())?.role as PersonRole);
  return <AdminShell role={role}>{children}</AdminShell>;
}
