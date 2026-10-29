// Бот МАТЭТИС при разработке на своём компьютере: pnpm telegram:dev (вместе с pnpm dev).
// Telegram не может достучаться до компьютера, поэтому команда сама забирает сообщения боту
// и пересылает их приложению на http://localhost:4317/api/telegram/webhook.
// На сервере вместо этого Telegram присылает сообщения сам (webhook).
try {
  process.loadEnvFile(".env.local");
} catch {
  // Файла нет — настройки берутся из окружения.
}

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const appUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:4317";
if (!token || !secret) {
  console.error("Заполните TELEGRAM_BOT_TOKEN и TELEGRAM_WEBHOOK_SECRET в .env.local");
  process.exit(1);
}

async function bot<T>(method: string, body: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as { ok: boolean; result: T; description?: string };
  if (!data.ok) throw new Error(`Telegram ${method}: ${data.description}`);
  return data.result;
}

const me = await bot<{ username: string }>("getMe");
// Пока у бота включён webhook, забирать сообщения самим Telegram не даёт.
await bot("deleteWebhook");
console.log(`Бот @${me.username} слушает сообщения и пересылает их в ${appUrl}. Остановить: Control+C`);

let offset = 0;
for (;;) {
  try {
    const updates = await bot<{ update_id: number }[]>("getUpdates", { offset, timeout: 25, allowed_updates: ["message"] });
    for (const update of updates) {
      offset = update.update_id + 1;
      const response = await fetch(`${appUrl}/api/telegram/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Telegram-Bot-Api-Secret-Token": secret },
        body: JSON.stringify(update),
      });
      console.log(`Сообщение ${update.update_id} → приложение ответило ${response.status}`);
    }
  } catch (error) {
    console.error((error as Error).message);
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}
