import type { Metadata } from "next";

import { APP_NAME } from "@/shared/config/brand";

export const metadata: Metadata = {
  title: `${APP_NAME} — админка`,
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
