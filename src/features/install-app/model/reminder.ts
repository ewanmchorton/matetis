/**
 * Когда напоминать установить приложение на «Домой».
 * После онбординга и после теста — по разу, это не считается. Потом при возвращении в браузер:
 * не чаще раза в 3 дня и не больше 3 раз.
 */
export type ReminderOccasion = "onboarding" | "after-test" | "return";

export type ReminderState = {
  /** Сколько раз напомнили при возвращении (onboarding и after-test не считаются). */
  returnCount: number;
  /** Когда окно показывали последний раз, мс. */
  lastShownAt: number | null;
  afterTestShown: boolean;
};

export const initialReminderState: ReminderState = { returnCount: 0, lastShownAt: null, afterTestShown: false };

export const REMIND_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000;
export const MAX_RETURN_REMINDERS = 3;

export function shouldRemind(occasion: ReminderOccasion, state: ReminderState, now: number): boolean {
  if (occasion === "onboarding") return true;
  if (occasion === "after-test") return !state.afterTestShown;
  if (state.returnCount >= MAX_RETURN_REMINDERS) return false;
  return state.lastShownAt === null || now - state.lastShownAt >= REMIND_INTERVAL_MS;
}

/** Состояние после показа. Любой показ сдвигает отсчёт 3 дней, в лимит идут только возвращения. */
export function markShown(occasion: ReminderOccasion, state: ReminderState, now: number): ReminderState {
  return {
    returnCount: state.returnCount + (occasion === "return" ? 1 : 0),
    lastShownAt: now,
    afterTestShown: state.afterTestShown || occasion === "after-test",
  };
}

// Установка привязана к телефону, поэтому помним в браузере этого телефона, без базы.
const STORAGE_KEY = "matetis.install-reminder";

export function readReminderState(): ReminderState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...initialReminderState, ...(JSON.parse(raw) as Partial<ReminderState>) } : initialReminderState;
  } catch {
    return initialReminderState;
  }
}

export function saveReminderState(state: ReminderState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Память браузера недоступна (приватный режим) — напомним ещё раз в другой день, это не страшно.
  }
}
