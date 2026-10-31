// Программа на сегодня — запрос из браузера.
import { request } from "@/shared/api/request";
import { isStaticPrototype } from "@/shared/config/env";

import { demoProgram } from "../model/demo-program";

import type { MyProgram } from "./my-program.server";

/** Часовой пояс телефона: по нему сервер считает «сегодня». */
function timeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "";
  }
}

export function loadMyProgram() {
  if (isStaticPrototype) return Promise.resolve(demoProgram());
  const zone = timeZone();
  return request<MyProgram>(`/api/program${zone ? `?tz=${encodeURIComponent(zone)}` : ""}`);
}
