"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { authClient } from "@/shared/auth/client";
import { isStaticPrototype } from "@/shared/config/env";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { SegmentedList, SegmentedTrigger } from "@/shared/ui/segmented";
import { Tabs } from "@/shared/ui/tabs";
import { TextField } from "@/shared/ui/text-field";
import { ScreenLayout } from "@/widgets/screen-layout";

type Mode = "register" | "login";

const MIN_PASSWORD_LENGTH = 8;

/** Тексты ошибок Better Auth по коду. Остальные ошибки сервера уже на русском (см. shared/auth/server.ts). */
const authErrorText: Record<string, string> = {
  USER_ALREADY_EXISTS: "Аккаунт с таким e-mail уже есть. Войдите",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Аккаунт с таким e-mail уже есть. Войдите",
  INVALID_EMAIL: "Проверьте e-mail",
  INVALID_EMAIL_OR_PASSWORD: "Неверный e-mail или пароль",
  PASSWORD_TOO_SHORT: `Пароль — не короче ${MIN_PASSWORD_LENGTH} символов`,
  PASSWORD_TOO_LONG: "Слишком длинный пароль",
};

function errorText(error: { code?: string; message?: string; status?: number }): string {
  if (error.code && authErrorText[error.code]) return authErrorText[error.code];
  if (error.status === 400 && error.message && /[а-яё]/i.test(error.message)) return error.message;
  return "Не получилось. Проверьте интернет и попробуйте ещё раз";
}

export function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("register");
  const [agree, setAgree] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!name) return setError("Укажите имя");
    if (!agree) return setError("Нужно согласие на обработку персональных данных");
    if (password.length < MIN_PASSWORD_LENGTH) return setError(authErrorText.PASSWORD_TOO_SHORT);

    // На GitHub Pages сервера нет: просто показываем следующий экран.
    if (isStaticPrototype) return router.push(routes.onboarding);

    setPending(true);
    setError(null);
    // consent проверяет сервер (shared/auth/server.ts). В типах клиента такого поля нет,
    // поэтому передаём его через отдельный объект, а не прямо в вызове.
    const body = { name, email, password, consent: true };
    const { error: signUpError } = await authClient.signUp.email(body);
    setPending(false);
    if (signUpError) return setError(errorText(signUpError));
    router.push(routes.onboarding);
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (isStaticPrototype) return router.push(routes.program);

    setPending(true);
    setError(null);
    const { error: signInError } = await authClient.signIn.email({ email, password });
    setPending(false);
    if (signInError) return setError(errorText(signInError));
    router.push(routes.program);
  }

  return (
    <ScreenLayout
      variant="hero"
      background="01_reg"
      compact
      title="Добро пожаловать"
      subtitle={
        mode === "register"
          ? "Создайте аккаунт, чтобы получить свою программу практик."
          : "Войдите, чтобы продолжить свою программу практик."
      }
      actions={
        <Button type="submit" form={`${mode}-form`} size="cta" disabled={pending}>
          {mode === "register" ? "Создать аккаунт" : "Войти"}
        </Button>
      }
    >
      <Tabs value={mode} onValueChange={(value) => switchMode(value as Mode)}>
        <SegmentedList className="h-10! rounded-[14px] [&_[data-slot=tabs-trigger]]:rounded-[11px]">
          <SegmentedTrigger value="register">Регистрация</SegmentedTrigger>
          <SegmentedTrigger value="login">Вход</SegmentedTrigger>
        </SegmentedList>
      </Tabs>

      {/* Обе формы лежат друг на друге, видна одна. Место занимает более длинная (регистрация),
          поэтому при переключении заголовок и кнопка не прыгают. */}
      <div className="-mt-1 grid">
        <form
          id="register-form"
          className={cn("col-start-1 row-start-1 grid content-start gap-1.5", mode !== "register" && "invisible")}
          inert={mode !== "register"}
          onSubmit={register}
          noValidate
        >
          <TextField compact id="r-name" name="name" label="Имя" autoComplete="given-name" required />
          <TextField compact id="r-email" name="email" type="email" label="E-mail" autoComplete="email" inputMode="email" required />
          <TextField
            compact
            id="r-password"
            name="password"
            type="password"
            label="Пароль"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
          />
          <label className="flex min-h-10 cursor-pointer items-center gap-3 pt-1">
            <Checkbox
              className="size-6 shrink-0 rounded-md border-primary/40 bg-background/70 [&_svg]:size-4!"
              aria-label="Согласие на обработку персональных данных"
              checked={agree}
              onCheckedChange={(value) => setAgree(value === true)}
            />
            <span className="type-caption font-normal text-muted-foreground">
              Даю согласие на обработку персональных данных и принимаю условия использования
            </span>
          </label>
        </form>

        <form
          id="login-form"
          className={cn("col-start-1 row-start-1 grid content-start gap-1.5", mode !== "login" && "invisible")}
          inert={mode !== "login"}
          onSubmit={login}
          noValidate
        >
          <TextField compact id="l-email" name="email" type="email" label="E-mail" autoComplete="email" inputMode="email" required />
          <TextField compact id="l-password" name="password" type="password" label="Пароль" autoComplete="current-password" required />
        </form>
      </div>

      {error && (
        <p role="alert" className="type-secondary -mt-3 text-destructive">
          {error}
        </p>
      )}
    </ScreenLayout>
  );
}
