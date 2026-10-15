// Ошибка правила приложения: понятный текст для человека и код для проверки в коде и тестах.
export class AppError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
