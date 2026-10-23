import { requireAdminPage } from "@/shared/auth/session";

// «Ученики» — только для администратора: контент-менеджер сюда не попадает.
export default async function AdminStudentsLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage("admin");
  return children;
}
