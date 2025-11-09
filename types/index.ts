export type BountyCategory = 
  | 'need-car'
  | 'need-dining-dollars'
  | 'need-skills'
  | 'physical-effort'
  | 'waiting-holding';

export type BountyStatus = 'open' | 'in-progress' | 'completed' | 'cancelled';

export type TimeDuration = 'quick' | 'short' | 'medium' | 'long';

export interface Bounty {
  id: string;
  title: string;
  description: string;
  category: BountyCategory | null;
  reward: number;
  status: BountyStatus;
  postedBy: string;
  postedByName: string;
  postedByAvatar: string;
  createdAt: Date;
  duration: TimeDuration;
  applicants: number;
  tags: string[];
  huntersNeeded?: number;
  acceptedHunters?: string[];
}

export interface Review {
  id: string;
  bountyId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  revieweeId: string;
  revieweeName: string;
  rating: number;
  comment: string;
  createdAt: Date;
  role: 'hunter' | 'poster';
}

export interface Notification {
  id: string;
  userId: string;
  type: 'bounty-accepted' | 'bounty-completed' | 'review-received' | 'follow';
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  relatedId?: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  bountiesPosted: number;
  bountiesCompleted: number;
  totalEarned: number;
  rating: number;
  joinedDate: Date;
  credits: number;
  reviews?: Review[];
  followers?: string[];
  following?: string[];
  accountNumber?: number;
}

export type ConversationType = 'direct' | 'hunter-negotiation' | 'poster-negotiation';

export type MessageType = 'text' | 'pay-request';

export interface PayRequest {
  amount: number;
  status: 'pending' | 'accepted' | 'rejected';
  acceptedBy?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
  read: boolean;
  type: MessageType;
  payRequest?: PayRequest;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  participantId?: string;
  participantName?: string;
  participantAvatar?: string;
  participants?: {
    id: string;
    name: string;
    avatar: string;
    role: 'hunter' | 'poster';
  }[];
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  bountyId: string;
  bountyTitle: string;
  originalReward: number;
}

export interface BountyTemplate {
  id: string;
  name: string;
  category: BountyCategory;
  title: string;
  description: string;
  tags: string[];
}
