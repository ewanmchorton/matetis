// Программа на сегодня – запрос из браузера.
import { request } from "@/shared/api/request";
import { isStaticPrototype } from "@/shared/config/env";

import { demoProgram } from "../model/demo-program";

import type { MyProgram, ProgramPractice } from "./my-program.server";

/** Последняя загруженная программа. Переход на практику и обратно берёт её сразу, без чужого экрана. */
let remembered: MyProgram | null = null;

export function rememberedProgram() {
  return remembered;
}

export function rememberedPractice(id: string): ProgramPractice | null {
  const program = remembered;
  if (!program) return null;
  return (
    [...program.morning, ...program.evening, ...program.weekly, ...program.awareness].find((item) => item.id === id) ??
    null
  );
}

/** Часовой пояс телефона: по нему сервер считает «сегодня». */
function timeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "";
  }
}

export function loadMyProgram() {
  const remember = (program: MyProgram) => {
    remembered = program;
    return program;
  };
  if (isStaticPrototype) return Promise.resolve(remember(demoProgram()));
  const zone = timeZone();
  return request<MyProgram>(`/api/program${zone ? `?tz=${encodeURIComponent(zone)}` : ""}`).then(remember);
}
