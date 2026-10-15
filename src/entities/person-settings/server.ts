// Только для серверного кода. Экраны получают эти данные через серверные действия.
export type { PersonSettings } from "./api/person-settings.server";
export { getMySettings, updateMySettings } from "./api/person-settings.server";
