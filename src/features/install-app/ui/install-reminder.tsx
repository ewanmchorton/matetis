"use client";

import { useEffect, useState } from "react";

import { detectDevice, type Device } from "../model/device";
import { openedFromHomeScreen } from "../model/install-prompt";
import { markShown, readReminderState, saveReminderState, shouldRemind, type ReminderOccasion } from "../model/reminder";
import { InstallSheet } from "./install-sheet";

// На одном экране может стоять два напоминания (экран программы и раздел вкладок).
// Показывается первое запланированное, второе пропускает этот показ.
let scheduled = false;

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
    if (scheduled || !shouldRemind(occasion, state, Date.now())) return;

    scheduled = true;
    const timer = window.setTimeout(() => {
      saveReminderState(markShown(occasion, state, Date.now()));
      setDevice(detected);
      setOpen(true);
    }, delayMs);
    return () => {
      scheduled = false;
      window.clearTimeout(timer);
    };
  }, [occasion, delayMs]);

  if (!device) return null;
  return <InstallSheet reminder device={device} open={open} onOpenChange={setOpen} />;
}
