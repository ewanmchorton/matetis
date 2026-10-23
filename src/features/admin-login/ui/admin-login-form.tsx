"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { authClient } from "@/shared/auth/client";
import { APP_NAME } from "@/shared/config/brand";
import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

/** Вход в админку по коду из письма. signedInEmail — человек уже вошёл, но он не сотрудник. */
export function AdminLoginForm({ signedInEmail }: { signedInEmail: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
    setPending(false);
    if (sendError) return setError("Не удалось отправить код. Проверьте почту и попробуйте ещё раз");
    setCodeSent(true);
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error: signInError } = await authClient.signIn.emailOtp({ email, otp: code });
    setPending(false);
    if (signInError) return setError("Неверный или устаревший код");
    // Роль проверяет сервер: не сотрудника вернёт на эту страницу.
    router.replace(routes.admin);
    router.refresh();
  }

  async function handleSignOut() {
    setPending(true);
    await authClient.signOut();
    setPending(false);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{APP_NAME} — админка</CardTitle>
        <CardDescription>Вход для администратора и контент-менеджера</CardDescription>
      </CardHeader>
      <CardContent>
        {signedInEmail ? (
          <div className="space-y-4">
            <p className="text-sm">
              У учётной записи {signedInEmail} нет доступа к админке.
            </p>
            <Button className="w-full" variant="outline" disabled={pending} onClick={handleSignOut}>
              Выйти
            </Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={codeSent ? handleSignIn : handleSendCode}>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Почта</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                disabled={codeSent}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            {codeSent && (
              <div className="space-y-2">
                <Label htmlFor="admin-code">Код из письма</Label>
                <Input
                  id="admin-code"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoFocus
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                />
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button className="w-full" type="submit" disabled={pending}>
              {codeSent ? (pending ? "Входим…" : "Войти") : pending ? "Отправляем…" : "Получить код"}
            </Button>
            {codeSent && (
              <Button
                className="w-full"
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => {
                  setCodeSent(false);
                  setCode("");
                  setError(null);
                }}
              >
                Другая почта
              </Button>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
