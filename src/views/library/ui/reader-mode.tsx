"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

/** Высота листа: от текущего места до нижнего меню, чтобы страница не уезжала под него. */
export function useReaderFrame(ref: RefObject<HTMLElement | null>, active: boolean) {
  const [height, setHeight] = useState(360);

  useLayoutEffect(() => {
    if (!active) return;
    const measure = () => {
      const node = ref.current;
      if (!node) return;
      const nav = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-height")) || 64;
      const next = window.innerHeight - node.getBoundingClientRect().top - nav - 28;
      setHeight(Math.max(240, Math.round(next)));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [ref, active]);

  return height;
}
