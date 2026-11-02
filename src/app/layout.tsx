import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { APP_NAME } from "@/shared/config/brand";
import { RegisterServiceWorker } from "@/shared/pwa/register-sw";

import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

// Заголовки и логотип. По гайду нужен только Medium (500).
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} — практики по типу и стихии`,
  description:
    "Ежедневные практики, ритуалы и рекомендации по вашему типу и текущей стихии.",
  applicationName: APP_NAME,
  // Адреса — с префиксом сайта-прототипа (/matetis на GitHub Pages), иначе иконки там не находятся.
  manifest: `${basePath}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
  },
  // Логотип: вкладка браузера, экран «Домой» на iPhone. Для Android — иконки в manifest.webmanifest.
  icons: {
    icon: [
      { url: `${basePath}/favicon.ico`, sizes: "16x16 32x32 48x48" },
      { url: `${basePath}/icon-192.png`, type: "image/png", sizes: "192x192" },
    ],
    apple: { url: `${basePath}/apple-touch-icon.png`, sizes: "180x180" },
  },
};

export const viewport: Viewport = {
  // Цвет полосы под часами совпадает с верхом экрана (Ivory): без резкой границы.
  themeColor: "#FAF7F2",
  // Экран занимает и зоны под вырезом и полоской жестов; отступы от них задаёт каркас экрана.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${manrope.variable} ${cormorant.variable} h-full antialiased`}>
      <body className="min-h-full bg-background min-[441px]:bg-muted">
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
