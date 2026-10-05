import type { Metadata } from "next";

import { AdminShell } from "@/widgets/admin-shell";

export const metadata: Metadata = { title: "Кабинет Мастера · МАТЭТИС" };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
