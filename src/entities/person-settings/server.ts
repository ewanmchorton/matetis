// Только для серверного кода. Экраны получают эти данные через серверные действия.
export type { PersonSettings, PersonSettingsChanges } from "./api/person-settings.server";
export { getMySettings, isTimeZone, updateMySettings } from "./api/person-settings.server";
