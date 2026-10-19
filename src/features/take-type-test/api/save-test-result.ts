// Сохранение результата теста: ответы и дата рождения уходят на сервер.
import type { PersonType } from "@/entities/person-type";
import { progressActions } from "@/entities/progress";
import { request, type RequestError } from "@/shared/api/request";
import { isDevelopment, isStaticPrototype } from "@/shared/config/env";

export type TestCodes = { group1: string; group2: string };

/**
 * Сохраняет тест и дату рождения. Без сервера (GitHub Pages) и при разработке без входа
 * результат остаётся только в браузере, чтобы экраны можно было пройти целиком.
 * Не вошёл на настоящем сервере — ошибка со status 401.
 */
export async function saveTestResult(codes: TestCodes, birthDate: string, type: PersonType) {
  const saveLocally = () => {
    progressActions.setType(type.id);
    progressActions.setBirthDate(birthDate);
  };
  if (isStaticPrototype) return saveLocally();

  try {
    await request("/api/type-test", { method: "POST", body: JSON.stringify(codes) });
    await request("/api/birth-reading", { method: "POST", body: JSON.stringify({ birthDate }) });
  } catch (error) {
    if ((error as RequestError).status === 401 && isDevelopment) return saveLocally();
    throw error;
  }
}
