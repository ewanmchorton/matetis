import Link from "next/link";

import { routes } from "@/shared/config/routes";
import { buttonVariants } from "@/shared/ui/button";
import { MobileFrame } from "@/widgets/mobile-frame";

export default function NotFound() {
  return (
    <MobileFrame>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-5xl font-semibold text-muted-foreground/40">404</p>
        <h1 className="text-xl font-semibold">Такой страницы нет</h1>
        <p className="text-sm text-muted-foreground">
          Откройте меню «Экраны» сверху справа, чтобы перейти к любому экрану прототипа.
        </p>
        <Link href={routes.auth} className={buttonVariants()}>
          К регистрации
        </Link>
      </main>
    </MobileFrame>
  );
}
