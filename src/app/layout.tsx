import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";

import { APP_NAME } from "@/shared/config/brand";
import { RegisterServiceWorker } from "@/shared/pwa/register-sw";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} — практики по типу и стихии`,
  description:
    "Ежедневные практики, ритуалы и рекомендации по вашему типу и текущей стихии.",
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f4ee",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full bg-muted">
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
