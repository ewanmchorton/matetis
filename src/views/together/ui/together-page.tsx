"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import type { JointCard } from "@/entities/together/server";
import { InviteSheet } from "@/features/invite-practice";
import { typograph } from "@/shared/lib/typograph";
import { Button } from "@/shared/ui/button";
import { GlassCard } from "@/shared/ui/glass-card";
import { ScreenLayout } from "@/widgets/screen-layout";

import { useTogether } from "../api/together-api";
import { JointCardView } from "./joint-card";
import { TogetherFeed, TogetherPeople } from "./together-feed";

/** Почему сейчас нельзя предложить новую практику. */
function inviteHint(card: JointCard | null): string | null {
  if (!card) return null;
  if (card.kind === "incoming" || (card.kind === "monthly" && !card.iAccepted)) {
    return "Сначала ответьте на карточку сверху.";
  }
  if (card.kind === "outgoing" || (card.kind === "monthly" && card.iAccepted)) {
    return "Ждём ответа. Новую практику можно предложить после него.";
  }
  if (card.kind === "active") return "Новую практику можно предложить, когда эта завершится.";
  return null;
}

function TogetherLoading() {
  return (
    <ScreenLayout variant="page" background="08_together" title="Вместе">
      <GlassCard aria-hidden className="h-48 animate-pulse" />
    </ScreenLayout>
  );
}

function TogetherWithLink() {
  const friend = useSearchParams().get("friend") ?? undefined;
  return <TogetherContent key={friend} friendId={friend} />;
}

/**
 * Вкладка «Вместе». `?friend=` читается в браузере (через Suspense),
 * потому что статический сайт-макет не может читать адрес на сервере.
 */
export function TogetherPage() {
  return (
    <Suspense fallback={<TogetherLoading />}>
      <TogetherWithLink />
    </Suspense>
  );
}

/** Карточка практики, события друзей и предложение новой. */
function TogetherContent({ friendId }: { friendId?: string }) {
  const together = useTogether();
  const [manualOpen, setManualOpen] = useState(false);
  const [autoClosed, setAutoClosed] = useState(false);
  const inviteOpen = manualOpen || (!!friendId && !autoClosed && together.state.status === "ready");

  function setInviteOpen(open: boolean) {
    setManualOpen(open);
    if (!open) setAutoClosed(true);
  }

  const ready = together.state.status === "ready" ? together.state.data : null;
  const hint = ready && !ready.canInvite ? inviteHint(ready.card) : null;

  return (
    <ScreenLayout variant="page" background="08_together" title="Вместе">
      {together.state.status === "loading" && <GlassCard aria-hidden className="h-48 animate-pulse" />}
      {together.state.status === "error" && (
        <GlassCard>
          <p role="alert" className="type-secondary text-destructive">
            {typograph(together.state.message)}
          </p>
        </GlassCard>
      )}
      {together.actionError && (
        <p role="alert" className="type-secondary text-destructive">
          {typograph(together.actionError)}
        </p>
      )}

      {ready?.card && (
        <JointCardView
          card={ready.card}
          asked={together.asked.includes(ready.card.partner.id)}
          pending={together.pending}
          onAnswer={(accept) => void together.answer(accept)}
          onCancel={() => void together.cancel()}
          onStop={() => void together.stop()}
          onDismiss={() => void together.dismiss()}
          onMark={(done) => void together.mark(done)}
          onAddFriend={() => void together.addFriend(ready.card!.partner.id)}
        />
      )}

      {ready &&
        (ready.hasFriends ? (
          <TogetherFeed feed={ready.feed} pending={together.pending} onSupport={(id, on) => void together.support(id, on)} />
        ) : (
          <TogetherPeople
            people={ready.people}
            asked={together.asked}
            pending={together.pending}
            onAdd={(id) => void together.addFriend(id)}
          />
        ))}

      {ready?.hasFriends && (
        <div className="space-y-2">
          {hint && <p className="type-caption text-muted-foreground">{typograph(hint)}</p>}
          <Button size="cta" disabled={!ready.canInvite || together.pending} onClick={() => setInviteOpen(true)}>
            Предложить практику
          </Button>
        </div>
      )}

      <InviteSheet
        open={inviteOpen}
        friendId={friendId}
        pending={together.pending}
        onOpenChange={setInviteOpen}
        blocked={hint}
        loadOptions={together.loadOptions}
        onInvite={async (friend, practice) => {
          if (await together.invite(friend, practice)) setInviteOpen(false);
        }}
      />
    </ScreenLayout>
  );
}
