// Отправка писем по SMTP. Только серверный код.
// При разработке письма ловит Mailpit из docker-compose.yml (просмотр: http://localhost:8025),
// на сервере — сервис рассылок: его адрес и пароль задаются в SMTP_* (см. .env.example).
import nodemailer from "nodemailer";

import { APP_NAME } from "@/shared/config/brand";

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransport() {
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
  return transport;
}

export async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  await getTransport().sendMail({
    from: process.env.MAIL_FROM ?? `${APP_NAME} <no-reply@matetis.local>`,
    to,
    subject,
    text,
  });
}
