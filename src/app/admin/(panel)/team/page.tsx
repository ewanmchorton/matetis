import { requireAdminPage } from "@/shared/auth/session";
import { AdminStaffPage } from "@/views/admin-staff";

// «Команда» — только для администратора: контент-менеджер сюда не попадает.
export default async function TeamPage() {
  await requireAdminPage("admin");
  return <AdminStaffPage />;
}
