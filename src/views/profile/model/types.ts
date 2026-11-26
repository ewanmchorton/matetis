import type { CompanionStage } from "@/entities/companion";
import type { PersonSettings } from "@/entities/person-settings/server";

/** Друг в профиле: имя и его спутник вместо аватарки. */
export type ProfileFriend = { id: string; name: string; companionStage: CompanionStage };

/** То, что экран профиля получает с сервера (GET /api/profile). */
export type ProfileData = {
  /**
   * contact – почта или ник в Telegram, смотря как человек входит.
   * typeId – по последнему тесту, birthDate – «ГГГГ-ММ-ДД»; null, пока не указаны.
   */
  me: {
    name: string;
    contact: string | null;
    companionStage: CompanionStage;
    typeId: string | null;
    birthDate: string | null;
  };
  settings: PersonSettings;
  friends: ProfileFriend[];
  incoming: { id: string; name: string }[];
};
