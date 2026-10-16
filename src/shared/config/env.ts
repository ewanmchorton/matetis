/**
 * Сборка для GitHub Pages: сервера и базы нет, экраны показывают демо-данные.
 * В сборке для сервера и при локальном запуске флаг выключен.
 */
export const isStaticPrototype = process.env.NEXT_PUBLIC_STATIC_PROTOTYPE === "true";

/** Локальный запуск разработчиком (pnpm dev). */
export const isDevelopment = process.env.NODE_ENV === "development";
