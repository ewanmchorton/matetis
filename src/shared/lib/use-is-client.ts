"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * `true` только в браузере. Нужен для частей экрана, зависящих от «сегодня»:
 * часовой пояс сервера и телефона может отличаться, и дата не совпадёт.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
