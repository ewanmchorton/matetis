"use client";

import { useEffect, useState } from "react";

import { typograph } from "@/shared/lib/typograph";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { NativeSelect } from "@/shared/ui/native-select";

import { enableOnDevice, readDeviceState, type DeviceState } from "../model/device";

export type PhraseSettingsValue = { phraseNotifications: boolean; phraseFromHour: number; phraseToHour: number };

const checkboxClass = "size-6 rounded-md border-primary/40 bg-background/70 [&_svg]:size-4!";
const selectClass = "h-11 w-auto rounded-xl bg-background/70 px-3 type-secondary";
const fromHours = Array.from({ length: 24 }, (_, hour) => hour);
const toHours = Array.from({ length: 24 }, (_, hour) => hour + 1);

/** Пункт «Фраза дня» в напоминаниях профиля: согласие, промежуток времени и разрешение на этом телефоне. */
export function PhraseSettings({
  value,
  demo,
  onChange,
}: {
  value: PhraseSettingsValue;
  /** Демо-профиль без сервера: телефон не подписываем. */
  demo: boolean;
  onChange: (changes: Partial<PhraseSettingsValue>) => Promise<void>;
}) {
  const [device, setDevice] = useState<DeviceState>("checking");
  const [error, setError] = useState<string | null>(null);

  // Разрешение телефона видно только в браузере, поэтому узнаём его после первой отрисовки.
  useEffect(() => {
    void readDeviceState().then(setDevice);
  }, []);

  async function allowOnDevice() {
    setError(null);
    try {
      setDevice(await enableOnDevice());
    } catch (enableError) {
      setError((enableError as Error).message || "Не удалось включить уведомления");
    }
  }

  async function toggle(on: boolean) {
    await onChange({ phraseNotifications: on });
    // Включили фразу, а телефон ещё не разрешал уведомления — сразу спрашиваем: нажатие уже было.
    if (on && device === "off" && !demo) await allowOnDevice();
  }

  return (
    <div className="space-y-2">
      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <Checkbox
          className={checkboxClass}
          aria-label="Фраза дня"
          checked={value.phraseNotifications}
          onCheckedChange={(checked) => void toggle(checked === true)}
        />
        <span className="type-secondary text-foreground">Фраза дня</span>
      </label>

      {value.phraseNotifications && (
        <div className="space-y-2 pl-9">
          <div className="flex flex-wrap items-center gap-2 type-secondary text-muted-foreground">
            <span className="flex items-center gap-2">
              с
              <NativeSelect
                aria-label="С какого часа"
                className={selectClass}
                value={value.phraseFromHour}
                onChange={(event) => void onChange({ phraseFromHour: Number(event.target.value) })}
              >
                {fromHours.map((hour) => (
                  <option key={hour} value={hour} disabled={hour >= value.phraseToHour}>
                    {hour}:00
                  </option>
                ))}
              </NativeSelect>
              до
              <NativeSelect
                aria-label="До какого часа"
                className={selectClass}
                value={value.phraseToHour}
                onChange={(event) => void onChange({ phraseToHour: Number(event.target.value) })}
              >
                {toHours.map((hour) => (
                  <option key={hour} value={hour} disabled={hour <= value.phraseFromHour}>
                    {hour}:00
                  </option>
                ))}
              </NativeSelect>
            </span>
          </div>

          {device === "unsupported" && (
            <p className="type-caption text-muted-foreground">
              {typograph("На iPhone уведомления приходят, если добавить МАТЭТИС на экран «Домой».")}
            </p>
          )}
          {device === "denied" && (
            <p className="type-caption text-muted-foreground">
              {typograph("Уведомления для МАТЭТИС выключены в настройках телефона.")}
            </p>
          )}
          {device === "off" && !demo && (
            <Button variant="outline" size="cta" className="w-full" onClick={() => void allowOnDevice()}>
              Разрешить уведомления на этом телефоне
            </Button>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="type-caption text-destructive">
          {typograph(error)}
        </p>
      )}
    </div>
  );
}
