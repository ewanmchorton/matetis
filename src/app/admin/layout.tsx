import type { Metadata } from "next";

import { APP_NAME } from "@/shared/config/brand";
import { AdminShell } from "@/widgets/admin-shell";

export const metadata: Metadata = {
  title: `${APP_NAME} — админка`,
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
