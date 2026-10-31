"use client";

import { useState } from "react";

import { formatPhone, type MyAccess } from "@/entities/access";
import { isTelegramContact } from "@/shared/auth/contact";
import { APP_NAME } from "@/shared/config/brand";
import { typograph } from "@/shared/lib/typograph";

import { TelegramIcon, ViberIcon } from "./messenger-icons";

type Purpose = "get" | "renew";

const lead: Record<Purpose, string> = {
  get: "Для получения доступа к программе свяжитесь с администратором в Telegram или Viber",
  renew: "Для продления доступа напишите администратору в Telegram или Viber",
};

function messageFor(purpose: Purpose, contact: string | null) {
  const wish = purpose === "get" ? "получить доступ к программе" : "продлить доступ к программе";
  const text = `Здравствуйте! Хочу ${wish} ${APP_NAME}.`;
  if (!contact) return text;
  // По этому контакту администратор находит человека в разделе «Доступы».
  return `${text} ${isTelegramContact(contact) ? "Мой Telegram" : "Моя почта"}: ${contact}`;
}

/** Текст «свяжитесь с администратором» с телефоном и знаки мессенджеров, которые открывают чат. */
export function ContactAdminText({ access, purpose }: { access: MyAccess; purpose: Purpose }) {
  return <>{typograph(`${lead[purpose]} ${formatPhone(access.adminPhone)}.`)}</>;
}

export function ContactAdminButtons({ access, purpose }: { access: MyAccess; purpose: Purpose }) {
  const [copied, setCopied] = useState(false);
  const message = messageFor(purpose, access.contact);
  // Telegram подставляет готовый текст только в чат по нику. По телефону — просто открывает чат.
  const telegramHref = access.adminTelegram
    ? `https://t.me/${access.adminTelegram}?text=${encodeURIComponent(message)}`
    : `https://t.me/${access.adminPhone}`;
  const viberHref = `viber://chat?number=${encodeURIComponent(access.adminPhone)}`;

  // Viber не умеет подставлять текст в чат с конкретным человеком: кладём его в буфер обмена.
  function copyForViber() {
    navigator.clipboard
      ?.writeText(message)
      .then(() => setCopied(true))
      .catch(() => {});
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-6">
        <a
          href={telegramHref}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center gap-1 type-caption font-normal text-muted-foreground"
        >
          <span className="grid size-14 place-items-center rounded-full bg-[#229ED9] text-white">
            <TelegramIcon className="size-14" />
          </span>
          Telegram
        </a>
        <a
          href={viberHref}
          onClick={copyForViber}
          className="flex flex-col items-center gap-1 type-caption font-normal text-muted-foreground"
        >
          <span className="grid size-14 place-items-center rounded-full bg-[#7360F2] text-white">
            <ViberIcon className="size-8" />
          </span>
          Viber
        </a>
      </div>
      {copied && (
        <p role="status" className="type-caption font-normal text-muted-foreground">
          {typograph("Текст сообщения скопирован — вставьте его в чат")}
        </p>
      )}
    </div>
  );
}
