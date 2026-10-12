export type { ProgressState } from "./model/progress-store";
export { progressActions, useProgress } from "./model/progress-store";
export type { BadgeRitual } from "./model/stats";
export {
  countInLastDays,
  countRitualMarksInLastDays,
  getElementBadgeProgress,
  getProgramStats,
  pluralRu,
} from "./model/stats";
