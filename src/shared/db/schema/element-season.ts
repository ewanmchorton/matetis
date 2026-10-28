// День перехода осенью с Земли на Металл. Остальные стихии идут по временам года и в базе не хранятся.
// Раздел «Справочники системы» в docs/data-model.md.
import { date, pgTable, smallint, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

/** С какого дня в этом году Металл. Нет строки за год — вся осень в Земле, пока дату не зададут. */
export const metalStart = pgTable("metal_start", {
  year: smallint("year").primaryKey(),
  /** День по Минску, с полуночи которого идёт Металл. */
  startsOn: date("starts_on").notNull(),
  /** Кто задал дату: контент-менеджер или админ. */
  setBy: text("set_by").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
