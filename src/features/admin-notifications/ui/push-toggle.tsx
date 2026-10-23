"use client";

import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";

import { request } from "@/shared/api/request";
import { Button } from "@/shared/ui/button";

type PushState = "checking" | "unsupported" | "denied" | "off" | "on";

/** Ключ из base64url в байты — так его принимает pushManager.subscribe. */
function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const normalized = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** Включить или выключить уведомления о заявках и окончании доступа на этом устройстве. */
export function PushToggle() {
  const [state, setState] = useState<PushState>("checking");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Поддержку и разрешение видно только в браузере, поэтому узнаём их после первой отрисовки.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!pushSupported()) return setState("unsupported");
    if (Notification.permission === "denied") return setState("denied");
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setState(subscription ? "on" : "off"))
      .catch(() => setState("off"));
  }, []);

  async function enable() {
    setPending(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const { publicKey } = await request<{ publicKey: string | null }>("/api/admin/push");
      if (!publicKey) throw new Error("На сервере не заданы ключи уведомлений");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes(publicKey),
      });
      await request("/api/admin/push", { method: "POST", body: JSON.stringify(subscription.toJSON()) });
      setState("on");
    } catch (enableError) {
      setError((enableError as Error).message || "Не удалось включить уведомления");
    } finally {
      setPending(false);
    }
  }

  async function disable() {
    setPending(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await request("/api/admin/push", { method: "DELETE", body: JSON.stringify({ endpoint: subscription.endpoint }) });
        await subscription.unsubscribe();
      }
      setState("off");
    } catch (disableError) {
      setError((disableError as Error).message);
    } finally {
      setPending(false);
    }
  }

  if (state === "checking") return null;

  return (
    <div className="space-y-1.5 rounded-2xl border bg-background p-4 text-sm">
      {state === "unsupported" && (
        <p className="text-muted-foreground">
          Уведомления в этом браузере недоступны. На iPhone они работают, если добавить админку на экран «Домой».
        </p>
      )}
      {state === "denied" && (
        <p className="text-muted-foreground">Уведомления запрещены в настройках браузера для этого сайта.</p>
      )}
      {state === "off" && (
        <Button className="h-11 w-full" variant="outline" disabled={pending} onClick={() => void enable()}>
          <Bell />
          Включить уведомления
        </Button>
      )}
      {state === "on" && (
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            Уведомления включены
          </span>
          <Button variant="ghost" size="sm" disabled={pending} onClick={() => void disable()}>
            <BellOff />
            Выключить
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
