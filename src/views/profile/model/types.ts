import type { PublicPerson } from "@/entities/friendship/server";
import type { PersonSettings } from "@/entities/person-settings/server";

/** То, что экран профиля получает с сервера (GET /api/profile). */
export type ProfileData = {
  me: { name: string; email: string };
  settings: PersonSettings;
  friends: PublicPerson[];
  incoming: PublicPerson[];
};

export type { PublicPerson };
