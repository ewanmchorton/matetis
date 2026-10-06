export type Friendship = "friend" | "incoming" | "outgoing" | "none";

export type DemoPerson = {
  id: string;
  name: string;
  /** Короткая публичная строка. Психотип чужого человека не показываем. */
  about: string;
  /** Практики, которых нет в программе этого человека — пригласить нельзя. */
  unavailablePracticeIds: string[];
};

export type FeedKind = "first" | "week" | "together" | "return";

export type FeedEvent = {
  id: string;
  personId: string;
  kind: FeedKind;
  title: string;
  text: string;
};

export type InvitationStatus = "pending" | "accepted" | "declined";

export type Invitation = {
  id: string;
  practiceId: string;
  practiceTitle: string;
  friendId: string;
  direction: "incoming" | "outgoing";
  status: InvitationStatus;
  myDone: boolean;
  theirDone: boolean;
};

export type SocialState = {
  /** Человек сам решает, попадают ли его выполнения в ленту друзей. */
  shareActivity: boolean;
  relations: Record<string, Friendship>;
  /** Одна реакция «поддержать» на событие. */
  reactions: Record<string, boolean>;
  invitations: Invitation[];
};
