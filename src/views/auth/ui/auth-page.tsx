"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Logo } from "@/shared/ui/logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

export function AuthPage() {
  const router = useRouter();
  const [agree, setAgree] = useState(true);

  const submit = (next: string) => (e: FormEvent) => {
    e.preventDefault();
    router.push(next);
  };

  return (
    <main className="flex flex-1 flex-col gap-8 px-5 py-8">
      <Logo href={routes.auth} />
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold leading-tight">Добро пожаловать</h1>
        <p className="text-muted-foreground">
          Создайте аккаунт, чтобы получить свою программу практик.
        </p>
      </div>

      <Tabs defaultValue="register">
        <TabsList className="w-full">
          <TabsTrigger value="register">Регистрация</TabsTrigger>
          <TabsTrigger value="login">Вход</TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="pt-4">
          <form className="grid gap-4" onSubmit={submit(routes.onboarding)}>
            <div className="grid gap-2">
              <Label htmlFor="r-name">Имя</Label>
              <Input id="r-name" defaultValue="Анна" className="h-11" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="r-email">E-mail</Label>
              <Input id="r-email" type="email" defaultValue="anna@example.ru" className="h-11" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="r-pass">Пароль</Label>
              <Input id="r-pass" type="password" defaultValue="demo-password" className="h-11" />
            </div>
            <Label className="flex items-start gap-2 text-sm font-normal leading-snug text-muted-foreground">
              <Checkbox
                className="mt-0.5"
                checked={agree}
                onCheckedChange={(v) => setAgree(v === true)}
              />
              Согласна на обработку персональных данных и принимаю условия использования
            </Label>
            <Button type="submit" size="lg" className="h-11 text-base" disabled={!agree}>
              Создать аккаунт
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="login" className="pt-4">
          <form className="grid gap-4" onSubmit={submit(routes.typeResult)}>
            <div className="grid gap-2">
              <Label htmlFor="l-email">E-mail</Label>
              <Input id="l-email" type="email" defaultValue="anna@example.ru" className="h-11" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="l-pass">Пароль</Label>
              <Input id="l-pass" type="password" defaultValue="demo-password" className="h-11" />
            </div>
            <Button type="submit" size="lg" className="h-11 text-base">
              Войти
            </Button>
            <button type="button" className="text-sm text-muted-foreground hover:text-foreground">
              Забыли пароль?
            </button>
          </form>
        </TabsContent>
      </Tabs>

      <p className="text-center text-xs text-muted-foreground">
        Прототип: данные никуда не отправляются. Способ входа (e-mail, код, Telegram) ещё
        обсуждается.{" "}
        <Link href={routes.onboarding} className="underline">
          Пропустить
        </Link>
      </p>
    </main>
  );
}
