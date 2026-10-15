import { requireAdminPage } from "@/shared/auth/session";
import { AdminShell } from "@/widgets/admin-shell";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return <AdminShell>{children}</AdminShell>;
}
