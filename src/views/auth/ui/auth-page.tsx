"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { request } from "@/shared/api/request";
import { authClient } from "@/shared/auth/client";
import { isStaticPrototype } from "@/shared/config/env";
import { routes } from "@/shared/config/routes";
import { typograph } from "@/shared/lib/typograph";
import { BackButton } from "@/shared/ui/back-button";
import { Button, buttonVariants } from "@/shared/ui/button";
import { TextField } from "@/shared/ui/text-field";
import { ScreenLayout } from "@/widgets/screen-layout";

const CODE_LENGTH = 6;
/** Совпадает с SIGN_IN_CODE_MINUTES в shared/auth/server.ts. */
const CODE_MINUTES = 10;
/** Как часто спрашивать сервер, подтвердил ли человек вход в боте. */
const TELEGRAM_POLL_MS = 2000;
const consentText =
  "Нажимая «Получить код» или «Войти через Telegram», вы соглашаетесь с обработкой персональных данных и условиями использования";

/** Тексты ошибок Better Auth по коду. */
const authErrorText: Record<string, string> = {
  INVALID_EMAIL: "Проверьте e-mail",
  INVALID_OTP: "Неверный код. Проверьте письмо",
  OTP_EXPIRED: "Код устарел. Отправьте новый",
  TOO_MANY_ATTEMPTS: "Слишком много попыток. Отправьте новый код",
};

function errorText(error: { code?: string; message?: string; status?: number }): string {
  if (error.code && authErrorText[error.code]) return authErrorText[error.code];
  if (error.status === 429) return "Слишком часто. Подождите минуту и попробуйте ещё раз";
  if (error.status === 400 && error.message && /[а-яё]/i.test(error.message)) return error.message;
  return "Не получилось. Проверьте интернет и попробуйте ещё раз";
}

/**
 * Вход по коду из письма или через бота в Telegram. Первый вход создаёт учётную запись и ведёт на онбординг,
 * дальше — в тест, если он не пройден, иначе в программу.
 */
export function AuthPage() {
  const router = useRouter();
  /** Ссылка на бота: человек ушёл подтверждать вход в Telegram. */
  const [telegramUrl, setTelegramUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  async function sendCode() {
    setPending(true);
    setError(null);
    const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
    setPending(false);
    if (sendError) {
      setError(errorText(sendError));
      return false;
    }
    return true;
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError(authErrorText.INVALID_EMAIL);
    // На GitHub Pages сервера нет: просто показываем следующий шаг.
    if (isStaticPrototype || (await sendCode())) {
      setCodeSent(true);
      setResent(false);
    }
  }

  async function resend() {
    setCode("");
    if (await sendCode()) setResent(true);
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.length !== CODE_LENGTH) return setError(`Введите ${CODE_LENGTH} цифр из письма`);
    if (isStaticPrototype) return router.push(routes.onboarding);

    setPending(true);
    setError(null);
    const { data, error: signInError } = await authClient.signIn.emailOtp({ email: email.trim(), otp: code });
    if (signInError || !data) {
      setPending(false);
      return setError(errorText(signInError ?? {}));
    }
    await goAfterSignIn(data.user.name);
  }

  async function goAfterSignIn(name: string) {
    // Имя спрашивает тест, поэтому пустое имя — первый вход: сначала знакомство с приложением.
    if (!name) return router.push(routes.onboarding);
    // Не удалось узнать, пройден ли тест, — открываем программу.
    const current = await request<{ type: unknown }>("/api/type-test").catch(() => null);
    router.push(current && !current.type ? routes.typeTest : routes.program);
  }

  async function startTelegram() {
    if (isStaticPrototype) return router.push(routes.onboarding);
    setPending(true);
    setError(null);
    const { data, error: startError } = await authClient.telegram.start();
    setPending(false);
    if (startError || !data) return setError(errorText(startError ?? {}));
    setTelegramUrl(data.url);
  }

  // Пока человек в Telegram, спрашиваем сервер, подтвердил ли он вход.
  // Вернулся в приложение — спрашиваем сразу, не дожидаясь следующего раза.
  useEffect(() => {
    if (!telegramUrl) return;
    let stopped = false;
    let checking = false;
    async function check() {
      if (stopped || checking) return;
      checking = true;
      const { data } = await authClient.telegram.complete();
      checking = false;
      if (stopped || !data) return;
      if (data.status === "signed-in") {
        stopped = true;
        await goAfterSignIn(data.user.name);
      } else if (data.status === "expired") {
        stopped = true;
        setTelegramUrl(null);
        setError("Ссылка для входа устарела. Нажмите «Войти через Telegram» ещё раз");
      }
    }
    const timer = window.setInterval(() => void check(), TELEGRAM_POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && void check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // goAfterSignIn меняется на каждой отрисовке, а проверку нужно запускать только при новой ссылке.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telegramUrl]);

  if (telegramUrl) {
    return (
      <ScreenLayout
        variant="hero"
        background="01_reg"
        compact
        title="Вход через Telegram"
        subtitle="Откройте бота МАТЭТИС, нажмите «Начать» и вернитесь сюда — вход выполнится сам."
        actions={
          <>
            <BackButton onClick={() => setTelegramUrl(null)} />
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ size: "cta", className: "flex-1" })}
            >
              Открыть Telegram
            </a>
          </>
        }
      />
    );
  }

  if (codeSent) {
    return (
      <ScreenLayout
        variant="hero"
        background="01_reg"
        compact
        title="Введите код"
        subtitle={`Отправили ${CODE_LENGTH} цифр на ${email.trim()}. Код действует ${CODE_MINUTES} минут.`}
        actions={
          <>
            <BackButton
              onClick={() => {
                setCodeSent(false);
                setCode("");
                setError(null);
              }}
            />
            <Button type="submit" form="code-form" size="cta" className="flex-1" disabled={pending}>
              Войти
            </Button>
          </>
        }
      >
        <form id="code-form" className="grid gap-1.5" onSubmit={submitCode} noValidate>
          <TextField
            id="code"
            name="code"
            label="Код из письма"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={CODE_LENGTH}
            value={code}
            onChange={(event) => {
              setError(null);
              setCode(event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH));
            }}
            className="text-center text-[22px]! tracking-[0.5em]"
            autoFocus
          />
          <Button type="button" variant="link" className="min-h-11 type-secondary" disabled={pending} onClick={() => void resend()}>
            {resent ? "Код отправлен ещё раз" : "Отправить код ещё раз"}
          </Button>
        </form>
        {error && (
          <p role="alert" className="type-secondary -mt-3 text-destructive">
            {typograph(error)}
          </p>
        )}
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      variant="hero"
      background="01_reg"
      compact
      title="Добро пожаловать, Матэтис!"
      subtitle="Введите почту для входа"
      actions={
        <div className="grid w-full gap-3">
          <Button type="submit" form="email-form" size="cta" disabled={pending}>
            Получить код
          </Button>
          <Button
            variant="outline"
            size="cta"
            className="border-white/60 bg-background/80"
            disabled={pending}
            onClick={() => void startTelegram()}
          >
            Войти через Telegram
          </Button>
          <p className="type-caption text-center font-normal text-muted-foreground">{typograph(consentText)}</p>
        </div>
      }
    >
      <form id="email-form" className="grid gap-1.5" onSubmit={submitEmail} noValidate>
        <TextField
          id="email"
          name="email"
          type="email"
          label="E-mail"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(event) => {
            setError(null);
            setEmail(event.target.value);
          }}
        />
      </form>
      {error && (
        <p role="alert" className="type-secondary -mt-3 text-destructive">
          {typograph(error)}
        </p>
      )}
    </ScreenLayout>
  );
}
