import Link from "next/link";

import { routes } from "@/shared/config/routes";
import { buttonVariants } from "@/shared/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-5xl font-semibold text-muted-foreground/40">404</p>
      <h1 className="text-xl font-semibold">Такой страницы нет</h1>
      <p className="text-sm text-muted-foreground">
        Возможно, материал убрали или ссылка устарела.
      </p>
      <Link href={routes.program} className={buttonVariants()}>
        К программе
      </Link>
    </main>
  );
}
