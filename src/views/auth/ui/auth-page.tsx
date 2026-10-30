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
/** Ссылка на бота действует 10 минут (TELEGRAM_LOGIN_MINUTES на сервере): обновляем её чуть раньше. */
const TELEGRAM_LINK_REFRESH_MS = 9 * 60 * 1000;
const secondaryButtonClass = "border-white/60 bg-background/80";
const TELEGRAM_SECRET_KEY = "matetis-telegram-login-secret";
let fallbackSecret: string | undefined;

/**
 * Случайная строка для метки. Не crypto.randomUUID: телефон даёт его только на https,
 * а при проверке с телефона приложение открыто по http (http://….local:4317).
 */
function randomSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Метка этого браузера для входа через Telegram: войти по нажатой ссылке сможет только он.
 * Хранится в браузере, чтобы пережить перезапуск приложения, пока человек в Telegram.
 */
function browserSecret(): string {
  try {
    const saved = localStorage.getItem(TELEGRAM_SECRET_KEY);
    if (saved) return saved;
    const secret = randomSecret();
    localStorage.setItem(TELEGRAM_SECRET_KEY, secret);
    return secret;
  } catch {
    // Хранилище недоступно (например, частный режим) — метка живёт, пока открыт экран.
    return (fallbackSecret ??= randomSecret());
  }
}
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
  /**
   * Ссылка на бота готовится заранее, как только открылся экран: тогда кнопка сразу открывает Telegram.
   * Если ждать ответа сервера после нажатия, приложение на iPhone может не открыть Telegram.
   */
  const [telegramLink, setTelegramLink] = useState<{ url: string; token: string } | { error: string } | null>(null);
  /** Смена значения просит новую ссылку: прежняя устарела. */
  const [telegramLinkVersion, setTelegramLinkVersion] = useState(0);
  /** Человек нажал «Войти через Telegram» и подтверждает вход в боте: токен нажатой ссылки. */
  const [telegramWaiting, setTelegramWaiting] = useState<string | null>(null);
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

  // Готовим ссылку на бота и обновляем её, пока человек не нажал кнопку.
  useEffect(() => {
    if (isStaticPrototype || telegramWaiting) return;
    let cancelled = false;
    void authClient.telegram.start({ secret: browserSecret() }).then(({ data, error: startError }) => {
      if (cancelled) return;
      setTelegramLink(data ? { url: data.url, token: data.token } : { error: errorText(startError ?? {}) });
    });
    const timer = window.setTimeout(() => setTelegramLinkVersion((version) => version + 1), TELEGRAM_LINK_REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [telegramLinkVersion, telegramWaiting]);

  // Пока человек в Telegram, спрашиваем сервер, подтвердил ли он вход.
  // Вернулся в приложение — спрашиваем сразу, не дожидаясь следующего раза.
  useEffect(() => {
    if (!telegramWaiting) return;
    const waitingToken = telegramWaiting;
    let stopped = false;
    let checking = false;
    async function check() {
      if (stopped || checking) return;
      checking = true;
      const { data } = await authClient.telegram.complete({ secret: browserSecret(), token: waitingToken });
      checking = false;
      if (stopped || !data) return;
      if (data.status === "signed-in") {
        stopped = true;
        await goAfterSignIn(data.user.name);
      } else if (data.status === "expired") {
        stopped = true;
        setTelegramWaiting(null);
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
    // goAfterSignIn меняется на каждой отрисовке, а проверку нужно запускать только при нажатии кнопки.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telegramWaiting]);

  function telegramButton() {
    const label = "Войти через Telegram";
    // На GitHub Pages сервера нет: просто показываем следующий шаг.
    if (isStaticPrototype) {
      return (
        <Button variant="outline" size="cta" className={secondaryButtonClass} onClick={() => router.push(routes.onboarding)}>
          {label}
        </Button>
      );
    }
    if (telegramLink && "url" in telegramLink) {
      const { url, token } = telegramLink;
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "cta", className: secondaryButtonClass })}
          onClick={() => {
            setError(null);
            setTelegramWaiting(token);
          }}
        >
          {label}
        </a>
      );
    }
    // Ссылка ещё готовится или сервер не смог её дать — скажем об этом по нажатию.
    return (
      <Button
        variant="outline"
        size="cta"
        className={secondaryButtonClass}
        disabled={!telegramLink}
        onClick={() => telegramLink && "error" in telegramLink && setError(telegramLink.error)}
      >
        {label}
      </Button>
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
          {telegramButton()}
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
