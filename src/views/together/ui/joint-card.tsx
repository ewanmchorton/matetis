"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import type { CompanionStage } from "@/entities/companion";
import { isCompanionStage } from "@/entities/companion";
import { CompanionAvatar } from "@/entities/companion";
import type { JointCard } from "@/entities/together/server";
import { typograph } from "@/shared/lib/typograph";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { GlassCard } from "@/shared/ui/glass-card";

/** Карточка, которая ждёт действия: лёгкий зелёный фон. docs/design-guide.md, «Карточки». */
const attention = "border-primary/10 bg-primary/8";

const inMonth = [
  "январе",
  "феврале",
  "марте",
  "апреле",
  "мае",
  "июне",
  "июле",
  "августе",
  "сентябре",
  "октябре",
  "ноябре",
  "декабре",
];

export function companionStage(value: number): CompanionStage {
  return isCompanionStage(value) ? value : 1;
}

/** «2026-11-21» → «21 ноября». */
function dayMonth(isoDate: string) {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function Label({ children }: { children: string }) {
  return <p className="type-caption text-primary">{children}</p>;
}

/** Кружок отметки: пустой или галочка. Нажимается только своя. */
function Mark({
  done,
  label,
  onClick,
  disabled,
}: {
  done: boolean;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const className = cn(
    "grid size-11 place-items-center rounded-full border-2 border-primary",
    done ? "bg-primary text-primary-foreground" : "text-transparent",
  );
  if (!onClick) {
    return (
      <span className={className} aria-label={done ? `${label}: готово` : `${label}: ещё нет`}>
        <Check className="size-5" />
      </span>
    );
  }
  return (
    <button type="button" className={className} aria-pressed={done} aria-label={label} disabled={disabled} onClick={onClick}>
      <Check className="size-5" />
    </button>
  );
}

/**
 * Карточка сверху вкладки. Одна из: приглашение, ожидание, предложение месяца,
 * идущая практика, «Завершили».
 */
export function JointCardView({
  card,
  asked,
  pending,
  onAnswer,
  onCancel,
  onStop,
  onDismiss,
  onMark,
  onAddFriend,
}: {
  card: JointCard;
  asked: boolean;
  pending: boolean;
  onAnswer: (accept: boolean) => void;
  onCancel: () => void;
  onStop: () => void;
  onDismiss: () => void;
  onMark: (done: boolean) => void;
  onAddFriend: () => void;
}) {
  const [confirmStop, setConfirmStop] = useState(false);
  const name = card.partner.name;
  const friendButton = !card.partner.isFriend && (
    <Button size="cta" variant="outline" disabled={pending || asked} onClick={onAddFriend}>
      {asked ? "Запрос отправлен" : "Добавить в друзья"}
    </Button>
  );

  if (card.kind === "incoming") {
    return (
      <GlassCard className={cn("space-y-4", attention)} aria-label="Приглашение">
        <Label>Вас пригласили</Label>
        <div className="flex items-center gap-3">
          <CompanionAvatar stage={companionStage(card.partner.companionStage)} className="size-11" />
          <div>
            <p className="type-block">{typograph(`${name} приглашает`)}</p>
            <p className="type-caption text-muted-foreground">Пройти практику вместе</p>
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="type-section">{typograph(card.practice.title)}</h2>
          <p className="type-secondary text-muted-foreground">{typograph("7 дней с дня, когда вы примете.")}</p>
        </div>
        {friendButton}
        <div className="flex gap-3">
          <Button size="cta" className="flex-1" disabled={pending} onClick={() => onAnswer(true)}>
            Принять
          </Button>
          <Button size="cta" variant="outline" className="flex-1" disabled={pending} onClick={() => onAnswer(false)}>
            Отклонить
          </Button>
        </div>
      </GlassCard>
    );
  }

  if (card.kind === "outgoing") {
    return (
      <GlassCard className="space-y-4" aria-label="Ждём ответа">
        <Label>Ждём ответа</Label>
        <h2 className="type-section">{typograph(card.practice.title)}</h2>
        <p className="type-secondary text-muted-foreground">
          {typograph(`Ждём, пока ${name} ответит. 7 дней с дня согласия.`)}
        </p>
        <Button size="cta" variant="outline" disabled={pending} onClick={onCancel}>
          Отменить
        </Button>
      </GlassCard>
    );
  }

  if (card.kind === "monthly") {
    return (
      <GlassCard className={cn("space-y-4", !card.iAccepted && attention)} aria-label="Предложение месяца">
        <Label>Предложение месяца</Label>
        <div className="flex items-center gap-3">
          <CompanionAvatar stage={companionStage(card.partner.companionStage)} className="size-11" />
          <p className="type-block">{name}</p>
        </div>
        <div className="space-y-1">
          <h2 className="type-section">{typograph(card.practice.title)}</h2>
          <p className="type-secondary text-muted-foreground">
            {typograph(`В ${inMonth[new Date().getMonth()]} можно пройти эту практику вместе.`)}
          </p>
        </div>
        {friendButton}
        {card.iAccepted ? (
          <p className="type-secondary text-muted-foreground">{typograph(`Вы согласились. Ждём, пока ${name} ответит.`)}</p>
        ) : (
          <div className="flex gap-3">
            <Button size="cta" className="flex-1" disabled={pending} onClick={() => onAnswer(true)}>
              Давайте
            </Button>
            <Button size="cta" variant="outline" className="flex-1" disabled={pending} onClick={() => onAnswer(false)}>
              Не в этот раз
            </Button>
          </div>
        )}
      </GlassCard>
    );
  }

  if (card.kind === "completed") {
    return (
      <GlassCard className={cn("space-y-4", attention)} aria-label="Практика завершена">
        <Label>Завершили</Label>
        <h2 className="type-section">{typograph(card.practice.title)}</h2>
        <p className="type-secondary text-muted-foreground">{typograph(`Вы и ${name} прошли практику вместе.`)}</p>
        <Button size="cta" disabled={pending} onClick={onDismiss}>
          Хорошо
        </Button>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={cn("space-y-4", !card.myDone && attention)} aria-label="Идёт практика">
      <Label>Идёт практика</Label>
      <div className="space-y-1">
        <h2 className="type-section">{typograph(card.practice.title)}</h2>
        <p className="type-secondary text-muted-foreground">{typograph(`${name} · до ${dayMonth(card.endsOn)}`)}</p>
      </div>
      <ul className="divide-y divide-foreground/10">
        <li className="flex min-h-11 items-center justify-between gap-3">
          <span className="type-body">Вы</span>
          <Mark
            done={card.myDone}
            label={card.myDone ? "Снять свою отметку" : "Отметить практику выполненной"}
            disabled={pending}
            onClick={() => onMark(!card.myDone)}
          />
        </li>
        <li className="flex min-h-11 items-center justify-between gap-3">
          <span className="type-body">{name}</span>
          {card.partnerDone ? (
            <Mark done label={name} />
          ) : (
            <span className="grid size-11 place-items-center type-body text-muted-foreground" aria-label={`${name}: ещё нет`}>
              –
            </span>
          )}
        </li>
      </ul>
      {friendButton}
      {confirmStop ? (
        <div className="space-y-3">
          <p className="type-secondary">{typograph(`Прекратить практику? У ${name} она тоже закрыется. Отметки останутся.`)}</p>
          <div className="flex gap-3">
            <Button size="cta" variant="outline" className="flex-1" disabled={pending} onClick={onStop}>
              Прекратить
            </Button>
            <Button size="cta" variant="ghost" className="flex-1" disabled={pending} onClick={() => setConfirmStop(false)}>
              Оставить
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="min-h-11 text-left type-secondary text-muted-foreground underline underline-offset-4"
          onClick={() => setConfirmStop(true)}
        >
          Прекратить
        </button>
      )}
    </GlassCard>
  );
}
