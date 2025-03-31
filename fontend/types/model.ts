// types.ts

export type User = {
  id: string;
  email: string;
  password: string;
  posts: Post[];
  comments: Comment[];
  likes: Like[];
  followers: Follower[];
  following: Follower[];
  friends: Friend[];
  friendOf: Friend[];
  groups: Group[];
  groupMembers: GroupMember[];
  groupPosts: GroupPost[];
  notifications: Notification[];
  messages: Message[];
  sentMessages: Message[];
  receivedMessages: Message[];
  actionTickets: ActionTicket[];
  profile: Profile;
  isFriend: boolean;
  hasSentRequest?: boolean;
  hasFriendRequest?: boolean;
  hasReceivedRequest?: boolean;
  canMessage?: boolean;
  isFollowing?: boolean;
  isShowFollowing?: boolean;
  hasBlocked?: boolean;
  _count?: {
    followers: number;
    following: number;
  };
  restrictions?: string[];
  roles: string[];
};

export type GroupBlockedUser = {
  user: User;
  reason: string;
};

export type Hashtag = {
  id: string;
  name: string;
  createdAt: string;
  postCount: number;
};

export type Profile = {
  id: string;
  userId: string;
  name: string;
  gender: string;
  birthday: Date;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  user: User;
};

export type Post = {
  id: string;
  title: string;
  content?: string;
  visibility: Visibility;
  userId: string;
  createdAt: Date;
  user: User;
  comments: Comment[];
  likes: Like[];
  images: Image[];
  originalPost: Post;
  _count: {
    comments: number;
    reactions: number;
    shares: number;
    reports: number;
  };
  group?: Group;
  groupId?: string;
  hashTags: {
    hashtag: Hashtag;
  }[];
  reactions: Reaction[];
  savedPost: SavedPost[];

  // Trạng thái
  isLiked: boolean;
  isSaved: boolean;
};

export type SavedPost = {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
};

export type Reaction = {
  id: string;
  type: string;
  postId: string;
  post: Post;
  user: User;
  createdAt: Date;
};

export type Image = {
  id: string;
  url: string;
  postId: string;
  post: Post;
  createdAt: Date;
};

export type Comment = {
  id: string;
  content: string;
  createdAt: Date;
  image: string;
  sticker: Sticker;
  user: User;
  userId: string;
  post: Post;
  postId: string;
  isLiked: boolean;
  groupPost?: GroupPost;
  groupPostId?: string;
  replies: Comment[];
  parentId: string;
  parent: Comment;
  _count: {
    reactions: number;
    reports: number;
    replies: number;
  };
};

export type Like = {
  id: string;
  user: User;
  userId: string;
  post: Post;
  postId: string;
  groupPost?: GroupPost;
  groupPostId?: string;
};

export type Follower = {
  id: string;
  follower: User;
  followerId: string;
  following: User;
  followingId: string;
};

export type Friend = {
  id: string;
  user: User;
  userId: string;
  friend: User;
  friendId: string;
  createdAt: Date;
};

export type FriendRequest = {
  id: string;
  senderId: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  respondedAt: string | null;
  sender: User;
};

export type GroupJoinRequest = {
  id: string;
  groupId: string;
  userId: string;
  createdAt: Date;
  user: User;
  group: Group;
};

export type Group = {
  id: string;
  name: string;
  description?: string;
  iconUrl: string;
  bannerUrl: string;
  createdAt: Date;
  owner: User;
  ownerId: string;
  privacy: string;
  isJoined: boolean;
  isOwner: boolean;
  hasJoinRequest?: boolean;
  members: GroupMember[];
  posts: GroupPost[];
  messages: Message[];
  _count: {
    members: number;
  };
};

export type GroupMember = {
  id: string;
  group: Group;
  groupId: string;
  user: User;
  userId: string;
  role: string;
  joinedAt: Date;
  isFriend: boolean;
  hasFriendRequest: boolean;
};

export type GroupPost = {
  id: string;
  content: string;
  createdAt: Date;
  group: Group;
  groupId: string;
  author: User;
  authorId: string;
  comments: Comment[];
  likes: Like[];
};

export type Notification = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  user: User;
  userId: string;
  senderId: string;
  redirectUrl: string;
  sender: {
    profile: Profile;
  };
  createdAt: Date;
};

export type VerificationCode = {
  id: string;
  email: string;
  code: string;
  expiresAt: Date;
};

export type ActionTicket = {
  id: string;
  user?: User;
  userId?: string;
  ticket: string;
  action: string;
  expiresAt: Date;
};

export type RefreshToken = {
  id: string;
  userId: string;
  token: string;
  expiredAt: Date;
};

export interface Conversation {
  id: string;
  name: string;
  isGroup: boolean;
  isOnline: boolean;
  otherParticipantId: string;
  participants: ConversationParticipant[];
  messages: Message[];
  lastMessage: Message;
  iconUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  joinedAt: Date;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  stickerId?: string;
  conversationId: string;
  isRevoked: boolean;
  status?: "pending" | "sent" | "error";
  requestId?: string;
  sentAt: Date;
  isRead?: boolean;

  files: FileImage[];
  sender: User;
  sticker?: Sticker;
}

export interface ReportPost {
  id: string;
  post: Post;
  user: User;
  reason: string;
  description: string;
  status: "PENDING" | "RESOLVED" | "REJECTED";
  createdAt: Date;
}

export type Pagination = {
  isFirstPage: boolean;
  isLastPage: boolean;
  currentPage: number;
  nextPage: number;
  pageCount: number;
  totalCount: number;
  hasMore: boolean;
};

export interface FileImage {
  id: string;
  type: string;
  name: string;
  size: number;
  url: string;
  messageId: string;
}

export enum Visibility {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
  FRIENDS = "FRIENDS",
}

export enum Privacy {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}

export const DEFAULT_AVATAR_URL =
  "https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif";

export interface StickerPack {
  id: string;
  name: string;
  coverUrl: string;
  createdAt: Date;
  status: StickerStatus;
  stickers: Sticker[];
  _count: {
    stickers: number;
  };
}

export interface Sticker {
  id: string;
  name: string;
  url: string;
  packId: string;
  pack: StickerPack;
  status: StickerStatus;
}

export interface UserSticker {
  id: string;
  userId: string;
  stickerId: string;
  sticker: Sticker;
  createdAt: Date;
}

export enum StickerStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  DELETED = "DELETED",
}
