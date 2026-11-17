"use client";

import Link from "next/link";

import { CompanionImage } from "@/entities/companion";
import { routes } from "@/shared/config/routes";
import { typograph } from "@/shared/lib/typograph";
import { Button, buttonVariants } from "@/shared/ui/button";
import { GlassCard } from "@/shared/ui/glass-card";
import { ScreenLayout } from "@/widgets/screen-layout";

import { usePerson, type FriendAction, type PersonProfile } from "../api/person-api";

/** Профиль другого человека: его спутник, имя и дружба. */
export function PersonPage({ personId }: { personId: string }) {
  const { state, actionError, act } = usePerson(personId);
  const title = state.status === "ready" ? state.profile.person.name : "Профиль";

  return (
    <ScreenLayout variant="page" background="09_friend" title={title}>
      {state.status === "loading" && <GlassCard aria-hidden className="h-[480px] animate-pulse" />}
      {state.status === "not-found" && (
        <GlassCard>
          <p className="type-secondary text-muted-foreground">Такого профиля нет.</p>
        </GlassCard>
      )}
      {state.status === "error" && (
        <GlassCard>
          <p role="alert" className="type-secondary text-destructive">
            {typograph(state.message)}
          </p>
        </GlassCard>
      )}
      {state.status === "ready" && (
        <GlassCard className="space-y-4">
          <div className="flex flex-col items-center pt-2" aria-hidden>
            <CompanionImage stage={state.profile.companionStage} className="size-60" />
            <div className="-mt-1 h-4 w-28 rounded-full bg-foreground/15 blur-md" />
          </div>
          <FriendshipActions profile={state.profile} onAction={(action) => void act(action)} />
          {actionError && (
            <p role="alert" className="type-caption text-destructive">
              {typograph(actionError)}
            </p>
          )}
        </GlassCard>
      )}
    </ScreenLayout>
  );
}

function FriendshipActions({ profile, onAction }: { profile: PersonProfile; onAction: (action: FriendAction) => void }) {
  switch (profile.friendship) {
    case "none":
      return (
        <Button size="cta" onClick={() => onAction("send")}>
          Добавить в друзья
        </Button>
      );
    case "outgoing":
      return (
        <div className="space-y-3">
          <p className="type-secondary text-muted-foreground">Запрос отправлен.</p>
          <Button size="cta" variant="outline" onClick={() => onAction("cancel")}>
            Отменить запрос
          </Button>
        </div>
      );
    case "incoming":
      return (
        <div className="space-y-3">
          <p className="type-secondary text-foreground">
            {typograph(`${profile.person.name} хочет добавить вас в друзья`)}
          </p>
          <div className="flex gap-3">
            <Button size="cta" className="flex-1" onClick={() => onAction("accept")}>
              Принять
            </Button>
            <Button size="cta" variant="outline" className="flex-1" onClick={() => onAction("decline")}>
              Отклонить
            </Button>
          </div>
        </div>
      );
    case "friend":
      return (
        <div className="space-y-3">
          <p className="type-secondary text-muted-foreground">Вы друзья.</p>
          <Link href={routes.together} className={buttonVariants({ size: "cta", variant: "outline" })}>
            Предложить практику
          </Link>
          <Button size="cta" variant="ghost" className="text-muted-foreground" onClick={() => onAction("remove")}>
            Удалить из друзей
          </Button>
        </div>
      );
  }
}
