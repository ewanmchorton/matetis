import { beforeEach, describe, expect, it, vi } from "vitest";

import { extendAccess } from "@/entities/access/server";

import { clearDatabase, createPerson } from "../../../tests/people";
import { withPaidUser, withUser } from "./route-helpers";

// Вошедший человек подставляется в тесте: заголовков запроса здесь нет.
const signedIn = vi.hoisted(() => ({ user: null as null | { id: string; email: string; role: string } }));
vi.mock("@/shared/auth/session", () => ({ getCurrentUser: async () => signedIn.user }));

const ok = async () => ({ ok: true });

beforeEach(async () => {
  await clearDatabase();
  const id = await createPerson("Анна", "user", "anna@example.ru");
  signedIn.user = { id, email: "anna@example.ru", role: "user" };
});

describe("Платная часть приложения", () => {
  it("без доступа — 403 «no_access», бесплатная часть открыта", async () => {
    const paid = await withPaidUser(ok);
    expect(paid.status).toBe(403);
    expect(await paid.json()).toMatchObject({ code: "no_access" });
    expect((await withUser(ok)).status).toBe(200);
  });

  it("с доступом — запрос проходит", async () => {
    const admin = await createPerson("Татьяна Валерьевна", "admin");
    await extendAccess(admin, "anna@example.ru", { months: 1 });
    expect((await withPaidUser(ok)).status).toBe(200);
  });

  it("контент-менеджер проходит без подписки", async () => {
    const id = await createPerson("Контент", "content_manager");
    signedIn.user = { id, email: `${id}@test.local`, role: "content_manager" };
    expect((await withPaidUser(ok)).status).toBe(200);
  });

  it("не вошёл — 401", async () => {
    signedIn.user = null;
    expect((await withPaidUser(ok)).status).toBe(401);
  });
});
