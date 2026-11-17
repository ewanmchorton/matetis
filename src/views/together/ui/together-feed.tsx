"use client";

import Link from "next/link";

import { CompanionAvatar } from "@/entities/companion";
import type { FeedItem, SuggestedPerson } from "@/entities/together/server";
import { routes } from "@/shared/config/routes";
import { typograph } from "@/shared/lib/typograph";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { GlassCard } from "@/shared/ui/glass-card";
import { TextGlow } from "@/shared/ui/text-glow";

import { companionStage } from "./joint-card";

function eventCopy(item: FeedItem) {
  if (item.kind === "first_practice") return { who: item.author.name, text: "впервые занимается." };
  if (item.kind === "comeback") {
    return { who: item.author.name, text: "снова занимается после перерыва больше недели." };
  }
  const partner = item.partner?.name;
  return {
    who: partner ? `${item.author.name} и ${partner}` : item.author.name,
    text: partner ? "прошли практику вместе." : "и друг прошли практику вместе.",
  };
}

/** События друзей: кто что сделал и кнопка «Поддержать». */
export function TogetherFeed({
  feed,
  pending,
  onSupport,
}: {
  feed: FeedItem[];
  pending: boolean;
  onSupport: (eventId: string, on: boolean) => void;
}) {
  return (
    <section className="space-y-3" aria-labelledby="feed-title">
      <TextGlow kind="title">
        <h2 id="feed-title" className="type-section">
          События друзей
        </h2>
      </TextGlow>
      {feed.length === 0 ? (
        <TextGlow kind="text">
          <p className="type-secondary text-muted-foreground">
            {typograph("Пока тихо. Здесь появятся важные события друзей.")}
          </p>
        </TextGlow>
      ) : (
        <ul className="space-y-3">
          {feed.map((item) => {
            const copy = eventCopy(item);
            return (
              <li key={item.id}>
                <GlassCard className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Link href={`${routes.person}/${item.author.id}`} aria-label={item.author.name} className="shrink-0">
                      <CompanionAvatar stage={companionStage(item.author.companionStage)} className="size-11" />
                    </Link>
                    <p className="min-w-0 type-body">
                      <span className="font-semibold">{copy.who}</span> {typograph(copy.text)}
                    </p>
                  </div>
                  <Button
                    size="cta-sm"
                    variant="outline"
                    aria-pressed={item.supported}
                    disabled={pending}
                    className={cn(item.supported && "border-primary/30 bg-primary/8 text-primary")}
                    onClick={() => onSupport(item.id, !item.supported)}
                  >
                    {item.supported ? "Вы поддержали" : "Поддержать"}
                  </Button>
                </GlassCard>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Когда друзей нет: несколько людей из приложения, чтобы добавить. */
export function TogetherPeople({
  people,
  asked,
  pending,
  onAdd,
}: {
  people: SuggestedPerson[];
  asked: string[];
  pending: boolean;
  onAdd: (personId: string) => void;
}) {
  return (
    <section className="space-y-3" aria-labelledby="people-title">
      <TextGlow kind="title">
        <h2 id="people-title" className="type-section">
          Люди в МАТЭТИС
        </h2>
      </TextGlow>
      {people.length === 0 ? (
        <TextGlow kind="text">
          <p className="type-secondary text-muted-foreground">Пока здесь никого нет.</p>
        </TextGlow>
      ) : (
        <ul className="space-y-3">
          {people.map((person) => {
            const sent = person.friendship === "outgoing" || asked.includes(person.id);
            return (
              <li key={person.id}>
                <GlassCard>
                  <div className="flex items-center gap-3">
                    <Link href={`${routes.person}/${person.id}`} aria-label={person.name} className="shrink-0">
                      <CompanionAvatar stage={companionStage(person.companionStage)} className="size-11" />
                    </Link>
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="type-block">{person.name}</p>
                      <Button size="cta-sm" variant="outline" disabled={pending || sent} onClick={() => onAdd(person.id)}>
                        {sent ? "Запрос отправлен" : "Добавить в друзья"}
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
