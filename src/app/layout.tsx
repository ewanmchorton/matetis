import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";

import { PrototypeScreensNav } from "@/widgets/prototype-screens-nav";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "МАТЭТИС — практики по типу и стихии",
  description:
    "Ежедневные практики, ритуалы и рекомендации по вашему типу и текущей стихии.",
};

export const viewport: Viewport = {
  themeColor: "#f7f4ee",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${manrope.variable} h-full antialiased`}>
      {/* Прототип только мобильный: на широком экране показываем «телефон» по центру */}
      <body className="min-h-full bg-muted">
        <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col bg-background shadow-xl shadow-black/5 min-[391px]:border-x">
          <div className="sticky top-0 z-30 flex justify-end bg-background/90 px-5 py-2 backdrop-blur-sm">
            <PrototypeScreensNav />
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
