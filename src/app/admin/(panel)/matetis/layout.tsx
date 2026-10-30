import { requireAdminPage } from "@/shared/auth/session";

// «Матэтисы»: доступы, оплаты и команда — только для администратора: контент-менеджер сюда не попадает.
export default async function AdminAccessLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage("admin");
  return children;
}
