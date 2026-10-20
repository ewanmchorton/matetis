"use client";

import { useEffect, useState } from "react";

import { detectDevice, type Device } from "../model/device";
import { openedFromHomeScreen } from "../model/install-prompt";
import { markShown, readReminderState, saveReminderState, shouldRemind, type ReminderOccasion } from "../model/reminder";
import { InstallSheet } from "./install-sheet";

/**
 * Напоминание установить приложение. Ставится на экран один раз; само решает, показываться ли:
 * не с иконки, только на телефоне и по правилам из model/reminder.ts.
 */
export function InstallReminder({ occasion, delayMs = 0 }: { occasion: ReminderOccasion; delayMs?: number }) {
  const [device, setDevice] = useState<Device | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (openedFromHomeScreen()) return;
    const detected = detectDevice(navigator.userAgent, navigator.maxTouchPoints);
    if (detected === "other") return;
    const state = readReminderState();
    if (!shouldRemind(occasion, state, Date.now())) return;

    const timer = window.setTimeout(() => {
      saveReminderState(markShown(occasion, state, Date.now()));
      setDevice(detected);
      setOpen(true);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [occasion, delayMs]);

  if (!device) return null;
  return <InstallSheet reminder device={device} open={open} onOpenChange={setOpen} />;
}
