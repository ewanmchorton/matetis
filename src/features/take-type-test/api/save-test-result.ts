// Сохранение результата теста: ответы и дата рождения уходят на сервер.
import type { PersonType } from "@/entities/person-type";
import { progressActions } from "@/entities/progress";
import { request, type RequestError } from "@/shared/api/request";
import { authClient } from "@/shared/auth/client";
import { isDevelopment, isStaticPrototype } from "@/shared/config/env";

export type TestCodes = { group1: string; group2: string };

/**
 * Сохраняет имя, тест и дату рождения. Без сервера (GitHub Pages) и при разработке без входа
 * результат остаётся только в браузере, чтобы экраны можно было пройти целиком.
 * Не вошёл на настоящем сервере — ошибка со status 401.
 */
export async function saveTestResult(codes: TestCodes, name: string, birthDate: string, type: PersonType) {
  const saveLocally = () => {
    progressActions.setType(type.id);
    progressActions.setBirthDate(birthDate);
  };
  if (isStaticPrototype) return saveLocally();

  try {
    const { error } = await authClient.updateUser({ name });
    if (error) throw Object.assign(new Error(error.message ?? "Не удалось сохранить имя"), { status: error.status });
    await request("/api/type-test", { method: "POST", body: JSON.stringify(codes) });
    await request("/api/birth-reading", { method: "POST", body: JSON.stringify({ birthDate }) });
  } catch (error) {
    if ((error as RequestError).status === 401 && isDevelopment) return saveLocally();
    throw error;
  }
}
