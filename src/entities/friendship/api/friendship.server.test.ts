import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { db, friendRequest, user } from "@/shared/db";

import { clearDatabase, createPerson } from "../../../../tests/people";
import {
  acceptFriendRequest,
  declineFriendRequest,
  getPublicProfile,
  listFriends,
  listIncomingRequests,
  removeFriend,
  searchPeople,
  sendFriendRequest,
} from "./friendship.server";

let anna: string;
let boris: string;
let vera: string;

beforeEach(async () => {
  await clearDatabase();
  anna = await createPerson("Анна");
  boris = await createPerson("Борис");
  vera = await createPerson("Вера");
});

describe("Поиск людей", () => {
  it("находит человека по части имени без учёта регистра", async () => {
    const found = await searchPeople(anna, "бор");
    expect(found.map((p) => p.name)).toEqual(["Борис"]);
  });

  it("не показывает в результатах самого ищущего", async () => {
    const found = await searchPeople(anna, "Анна");
    expect(found).toEqual([]);
  });

  it("по пустому запросу ничего не находит", async () => {
    expect(await searchPeople(anna, "   ")).toEqual([]);
  });

  it("знаки % и _ в запросе ищутся как обычные символы, а не находят всех", async () => {
    expect(await searchPeople(anna, "%")).toEqual([]);
    expect(await searchPeople(anna, "_")).toEqual([]);
  });

  it("в результатах поиска только id, имя и аватар", async () => {
    const [person] = await searchPeople(anna, "Борис");
    expect(Object.keys(person).sort()).toEqual(["avatar", "id", "name"]);
  });
});

describe("Публичный профиль", () => {
  it("другой человек видит только имя и аватар — без почты, роли, даты рождения и типа", async () => {
    await db.update(user).set({ image: "https://example.test/boris.png" }).where(eq(user.id, boris));
    const profile = await getPublicProfile(anna, boris);
    expect(profile?.person).toEqual({
      id: boris,
      name: "Борис",
      avatar: "https://example.test/boris.png",
    });
  });

  it("друг тоже видит только имя и аватар", async () => {
    await sendFriendRequest(anna, boris);
    await acceptFriendRequest(boris, anna);
    const profile = await getPublicProfile(anna, boris);
    expect(Object.keys(profile!.person).sort()).toEqual(["avatar", "id", "name"]);
  });

  it("если человека нет, профиль не возвращается", async () => {
    expect(await getPublicProfile(anna, "нет-такого")).toBeNull();
  });

  it("показывает, кто кому отправил запрос", async () => {
    await sendFriendRequest(anna, boris);
    expect((await getPublicProfile(anna, boris))?.friendship).toBe("outgoing");
    expect((await getPublicProfile(boris, anna))?.friendship).toBe("incoming");
    expect((await getPublicProfile(vera, anna))?.friendship).toBe("none");
  });

  it("об отклонении никто не узнаёт: оба снова видят друг друга просто как не друзей", async () => {
    await sendFriendRequest(anna, boris);
    await declineFriendRequest(boris, anna);
    expect((await getPublicProfile(anna, boris))?.friendship).toBe("none");
    expect((await getPublicProfile(boris, anna))?.friendship).toBe("none");
  });
});

describe("Запрос в друзья", () => {
  it("после принятия запроса оба видят друг друга в списке друзей", async () => {
    await sendFriendRequest(anna, boris);
    await acceptFriendRequest(boris, anna);
    expect((await listFriends(anna)).map((p) => p.name)).toEqual(["Борис"]);
    expect((await listFriends(boris)).map((p) => p.name)).toEqual(["Анна"]);
  });

  it("пока запрос не принят, люди не друзья", async () => {
    await sendFriendRequest(anna, boris);
    expect(await listFriends(anna)).toEqual([]);
    expect(await listFriends(boris)).toEqual([]);
  });

  it("получатель видит входящий запрос, а отправитель — нет", async () => {
    await sendFriendRequest(anna, boris);
    expect((await listIncomingRequests(boris)).map((p) => p.name)).toEqual(["Анна"]);
    expect(await listIncomingRequests(anna)).toEqual([]);
  });

  it("нельзя отправить запрос самому себе", async () => {
    await expect(sendFriendRequest(anna, anna)).rejects.toMatchObject({ code: "self_request" });
  });

  it("нельзя отправить запрос несуществующему человеку", async () => {
    await expect(sendFriendRequest(anna, "нет-такого")).rejects.toMatchObject({
      code: "person_not_found",
    });
  });

  it("повторный запрос тому же человеку не создаёт второй", async () => {
    await sendFriendRequest(anna, boris);
    await expect(sendFriendRequest(anna, boris)).rejects.toMatchObject({ code: "already_sent" });
    expect(await db.select().from(friendRequest)).toHaveLength(1);
  });

  it("нельзя отправить запрос тому, кто уже друг", async () => {
    await sendFriendRequest(anna, boris);
    await acceptFriendRequest(boris, anna);
    await expect(sendFriendRequest(boris, anna)).rejects.toMatchObject({ code: "already_friends" });
  });

  it("встречный запрос сразу делает людей друзьями", async () => {
    await sendFriendRequest(anna, boris);
    expect(await sendFriendRequest(boris, anna)).toBe("friend");
    expect((await listFriends(anna)).map((p) => p.name)).toEqual(["Борис"]);
    expect(await db.select().from(friendRequest)).toHaveLength(1);
  });

  it("принять запрос может только получатель, а не отправитель", async () => {
    await sendFriendRequest(anna, boris);
    await expect(acceptFriendRequest(anna, boris)).rejects.toMatchObject({
      code: "request_not_found",
    });
    expect(await listFriends(anna)).toEqual([]);
  });

  it("посторонний не может принять чужой запрос", async () => {
    await sendFriendRequest(anna, boris);
    await expect(acceptFriendRequest(vera, anna)).rejects.toMatchObject({
      code: "request_not_found",
    });
  });

  it("отклонённый запрос не делает людей друзьями и пропадает из входящих", async () => {
    await sendFriendRequest(anna, boris);
    await declineFriendRequest(boris, anna);
    expect(await listFriends(anna)).toEqual([]);
    expect(await listIncomingRequests(boris)).toEqual([]);
  });

  it("отклонённый запрос нельзя потом принять", async () => {
    await sendFriendRequest(anna, boris);
    await declineFriendRequest(boris, anna);
    await expect(acceptFriendRequest(boris, anna)).rejects.toMatchObject({
      code: "request_not_found",
    });
  });

  it("после отклонения запрос можно отправить снова", async () => {
    await sendFriendRequest(anna, boris);
    await declineFriendRequest(boris, anna);
    expect(await sendFriendRequest(anna, boris)).toBe("outgoing");
    expect((await listIncomingRequests(boris)).map((p) => p.name)).toEqual(["Анна"]);
  });

  it("база не даёт создать две записи на одну пару людей, даже в обратном направлении", async () => {
    await db.insert(friendRequest).values({ fromUserId: anna, toUserId: boris });
    await expect(
      db.insert(friendRequest).values({ fromUserId: boris, toUserId: anna }),
    ).rejects.toThrow();
  });

  it("база не даёт сохранить запрос самому себе", async () => {
    await expect(
      db.insert(friendRequest).values({ fromUserId: anna, toUserId: anna }),
    ).rejects.toThrow();
  });
});

describe("Удаление из друзей", () => {
  it("дружба пропадает у обоих", async () => {
    await sendFriendRequest(anna, boris);
    await acceptFriendRequest(boris, anna);
    await removeFriend(boris, anna);
    expect(await listFriends(anna)).toEqual([]);
    expect(await listFriends(boris)).toEqual([]);
  });

  it("после удаления можно снова отправить запрос", async () => {
    await sendFriendRequest(anna, boris);
    await acceptFriendRequest(boris, anna);
    await removeFriend(anna, boris);
    expect(await sendFriendRequest(anna, boris)).toBe("outgoing");
  });

  it("нельзя удалить того, кто не друг, — неотвеченный запрос остаётся на месте", async () => {
    await sendFriendRequest(anna, boris);
    await expect(removeFriend(anna, boris)).rejects.toMatchObject({ code: "not_friends" });
    expect(await listIncomingRequests(boris)).toHaveLength(1);
  });

  it("удаление одной дружбы не трогает другие", async () => {
    await sendFriendRequest(anna, boris);
    await acceptFriendRequest(boris, anna);
    await sendFriendRequest(anna, vera);
    await acceptFriendRequest(vera, anna);
    await removeFriend(anna, boris);
    expect((await listFriends(anna)).map((p) => p.name)).toEqual(["Вера"]);
  });
});
