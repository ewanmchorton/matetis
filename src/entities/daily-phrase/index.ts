export { DEFAULT_TIME_ZONE, localDay, localHourToMoment } from "./model/zoned-time";

/** Фраза дня, как её получает админка (GET /api/admin/phrases). */
export type DailyPhraseDto = {
  id: string;
  text: string;
  /** Каким типам подходит. Пусто — всем. */
  typeIds: string[];
  createdAt: string;
};

/** Сколько знаков помещается в уведомление. Та же граница проверяется на сервере. */
export const PHRASE_MAX_LENGTH = 300;
