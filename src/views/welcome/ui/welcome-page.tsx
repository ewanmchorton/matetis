import Link from "next/link";

import { getCurrentElement } from "@/entities/element";
import { routes } from "@/shared/config/routes";
import { buttonVariants } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";

const steps = [
  ["Пройдите тест", "5 коротких вопросов, чтобы определить ваш тип из двенадцати."],
  ["Получите программу", "Практики подобраны под ваш тип и текущую стихию."],
  ["Практикуйте каждый день", "Отмечайте выполнение и следите за своим ритмом."],
];

export function WelcomePage() {
  const element = getCurrentElement();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-5 py-8 md:max-w-lg md:justify-center">
      <Logo href={routes.map} />
      <div className="space-y-3">
        <p className="text-sm font-medium text-primary">
          Сейчас стихия {element.name} · {element.season.toLowerCase()}
        </p>
        <h1 className="text-3xl font-semibold leading-tight">
          Ваш путь развития по системе Мастера
        </h1>
        <p className="text-muted-foreground">
          Ежедневные практики, ритуалы и рекомендации, которые меняются вместе со
          временем года.
        </p>
      </div>
      <ol className="space-y-4">
        {steps.map(([title, text], i) => (
          <li key={title} className="flex gap-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {i + 1}
            </span>
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-auto space-y-3 md:mt-4">
        <Link
          href={routes.typeTest}
          className={buttonVariants({ size: "lg", className: "h-12 w-full text-base" })}
        >
          Пройти тест
        </Link>
        <p className="text-center text-xs text-muted-foreground">
          Займёт около 3 минут. Вход и регистрация появятся в рабочей версии.
        </p>
      </div>
    </main>
  );
}
