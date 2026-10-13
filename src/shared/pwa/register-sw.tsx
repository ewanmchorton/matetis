"use client";

import { useEffect } from "react";

/** Регистрация service worker, чтобы сайт можно было поставить на экран «Домой». */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    void navigator.serviceWorker.register(`${base}/sw.js`);
  }, []);

  return null;
}
