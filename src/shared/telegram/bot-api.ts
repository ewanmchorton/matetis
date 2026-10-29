// Запросы к Telegram Bot API. Используется только в серверном коде.
// Токен бота — в TELEGRAM_BOT_TOKEN (выдаёт @BotFather).

function botToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN не задан. См. .env.example");
  return token;
}

/** Вызов метода Bot API. Ошибку Telegram превращает в исключение с его текстом. */
export async function callBotApi<T>(method: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`https://api.telegram.org/bot${botToken()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as { ok: boolean; result?: T; description?: string };
  if (!data.ok) throw new Error(`Telegram ${method}: ${data.description ?? response.status}`);
  return data.result as T;
}

export function sendTelegramMessage(chatId: number, text: string) {
  return callBotApi("sendMessage", { chat_id: chatId, text });
}
