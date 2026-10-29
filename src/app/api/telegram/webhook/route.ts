// Сообщения боту МАТЭТИС от Telegram. Telegram подписывает каждый запрос секретом TELEGRAM_WEBHOOK_SECRET.
// При разработке сообщения пересылает сюда pnpm telegram:dev.
import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { handleTelegramUpdate } from "@/shared/auth/telegram-login";
import { sendTelegramMessage } from "@/shared/telegram/bot-api";

function isFromTelegram(request: Request): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const received = request.headers.get("x-telegram-bot-api-secret-token");
  if (!secret || !received) return false;
  const a = Buffer.from(secret);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!isFromTelegram(request)) return NextResponse.json({ ok: false }, { status: 401 });
  const update: unknown = await request.json().catch(() => null);
  if (update && typeof update === "object") {
    const reply = await handleTelegramUpdate(update);
    if (reply) {
      // Не ответили — не страшно: вход всё равно подтверждён. Telegram не должен повторять сообщение.
      await sendTelegramMessage(reply.chatId, reply.text).catch((error) => console.error("Бот не ответил", error));
    }
  }
  return NextResponse.json({ ok: true });
}
