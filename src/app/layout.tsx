import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "МАТЭТИС — практики по системе Мастера",
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
          {children}
        </div>
      </body>
    </html>
  );
}
