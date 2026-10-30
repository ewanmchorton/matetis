import { requireAdminPage } from "@/shared/auth/session";
import { AdminStaffPage } from "@/views/admin-staff";

// «Сотрудники» — только для администратора: контент-менеджер сюда не попадает.
export default async function StaffPage() {
  await requireAdminPage("admin");
  return <AdminStaffPage />;
}
