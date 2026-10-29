import type { PublicPerson } from "@/entities/friendship/server";
import type { PersonSettings } from "@/entities/person-settings/server";

/** То, что экран профиля получает с сервера (GET /api/profile). */
export type ProfileData = {
  /** contact — почта или ник в Telegram, смотря как человек входит. */
  me: { name: string; contact: string | null };
  settings: PersonSettings;
  friends: PublicPerson[];
  incoming: PublicPerson[];
};

export type { PublicPerson };
