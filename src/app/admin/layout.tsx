import type { Metadata } from "next";

import { APP_NAME } from "@/shared/config/brand";

export const metadata: Metadata = {
  title: `${APP_NAME} — админка`,
  // Свой значок на главном экране: открывает сразу админку, а не часть для учеников.
  // Установить его можно только со страниц админки.
  manifest: "/admin-manifest.webmanifest",
  appleWebApp: { capable: true, title: "МАТЭТИС Доступы" },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
