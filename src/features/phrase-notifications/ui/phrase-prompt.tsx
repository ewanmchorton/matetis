"use client";

import { useEffect, useState } from "react";

import { openedFromHomeScreen } from "@/features/install-app";
import { isStaticPrototype } from "@/shared/config/env";
import { typograph } from "@/shared/lib/typograph";
import { Button } from "@/shared/ui/button";
import { GlassCard } from "@/shared/ui/glass-card";

import { enableOnDevice, readDeviceState, readPushInfo } from "../model/device";

// Предложение показываем один раз на этом телефоне: помним в браузере, без базы.
const STORAGE_KEY = "matetis.phrase-prompt";

function alreadyAsked() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "asked";
  } catch {
    return true;
  }
}

function rememberAsked() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "asked");
  } catch {
    // Память браузера недоступна — предложение просто не появится повторно в этот раз.
  }
}

/**
 * Один раз предложить включить фразу дня на экране программы.
 * Только в приложении с экрана «Домой» (на iPhone уведомления работают только там),
 * если человек не отказался от фразы в профиле и телефон ещё не спрашивал разрешение.
 */
export function PhrasePrompt() {
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isStaticPrototype || !openedFromHomeScreen() || alreadyAsked()) return;
    if (!("Notification" in window) || Notification.permission !== "default") return;
    let cancelled = false;
    void Promise.all([readDeviceState(), readPushInfo()])
      .then(([device, info]) => {
        if (!cancelled && device === "off" && info.phraseNotifications && info.publicKey) setVisible(true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible) return null;

  async function enable() {
    setError(null);
    try {
      await enableOnDevice();
      rememberAsked();
      setVisible(false);
    } catch (enableError) {
      setError((enableError as Error).message || "Не удалось включить уведомления");
    }
  }

  function later() {
    rememberAsked();
    setVisible(false);
  }

  return (
    <GlassCard aria-labelledby="phrase-prompt-title" className="space-y-3">
      <h2 id="phrase-prompt-title" className="type-section">
        Фраза дня
      </h2>
      <p className="type-secondary text-muted-foreground">
        {typograph("Раз в день в случайное время пришлём короткую фразу для размышления. Время можно выбрать в профиле.")}
      </p>
      <div className="flex gap-3">
        <Button variant="outline" size="cta" className="flex-1" onClick={later}>
          Не сейчас
        </Button>
        <Button size="cta" className="flex-1" onClick={() => void enable()}>
          Включить
        </Button>
      </div>
      {error && (
        <p role="alert" className="type-caption text-destructive">
          {typograph(error)}
        </p>
      )}
    </GlassCard>
  );
}
