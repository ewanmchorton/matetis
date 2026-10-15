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

/** signedInEmail — человек уже вошёл, но он не администратор. */
export function AdminLoginForm({ signedInEmail }: { signedInEmail: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { error: signInError } = await authClient.signIn.email({ email, password });
    setPending(false);
    if (signInError) {
      setError(signInError.status === 401 ? "Неверная почта или пароль" : "Не удалось войти. Попробуйте позже");
      return;
    }
    // Роль проверяет сервер: не администратора вернёт на эту страницу.
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
        <CardDescription>Вход только для администраторов</CardDescription>
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
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Почта</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Пароль</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button className="w-full" type="submit" disabled={pending}>
              {pending ? "Входим…" : "Войти"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
