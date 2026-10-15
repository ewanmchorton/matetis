// Только для серверного кода. Экраны получают эти данные через серверные действия.
export type { FriendshipStatus, PublicPerson, PublicProfile } from "./api/friendship.server";
export {
  acceptFriendRequest,
  declineFriendRequest,
  getPublicProfile,
  listFriends,
  listIncomingRequests,
  removeFriend,
  searchPeople,
  sendFriendRequest,
} from "./api/friendship.server";
