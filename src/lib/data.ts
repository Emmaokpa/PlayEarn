
import { FieldValue, Timestamp } from 'firebase/firestore';

export interface Game {
  id: string;
  name: string;
  category: string;
  iframeUrl: string;
  imageUrl: string;
  imageHint: string;
}

export interface Reward {
  id:string;
  name: string;
  description: string;
  coins: number;
  type: 'virtual' | 'physical';
  imageUrl: string;
  imageHint: string;
  isVipOnly?: boolean;
}

export interface UserProfile {
  id: string;
  telegramId: string;
  username: string;
  name: string;
  avatarUrl: string;
  coins: number;
  referralCode: string;
  isVip: boolean;
  isAdmin: boolean;
  registrationDate: string;
  gamePlaysToday?: number;
  lastGameplayReset?: string;
}

export interface AdView {
    id: string;
    userId: string;
    adId: string;
    timestamp: Timestamp;
}

export interface StickerPack {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  imageHint: string;
}

export interface InAppPurchase {
    id: string;
    type: 'coins' | 'spins';
    name: string;
    description: string;
    amount: number;
    price: number;
    imageUrl: string;
    imageHint: string;
}

export interface AffiliateOffer {
  id: string;
  title: string;
  description: string;
  link: string;
  imageUrl: string;
  imageHint: string;
  rewardCoins: number;
  createdAt: FieldValue;
}

export interface UserAffiliate {
    id: string; // offerId
    status: 'pending' | 'approved' | 'rejected';
    approvedAt?: Timestamp;
}

export interface AffiliateSubmission {
  id: string;
  userId: string;
  userName: string;
  offerId: string;
  offerTitle: string;
  proofText: string;
  proofImageUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: FieldValue;
  rewardAmount: number;
}

export interface SpinPrize {
    id: string;
    text: string;
    type: 'coins' | 'sticker' | 'entry' | 'gift_card';
    value: number | string;
    probability: number;
}

export interface SpinHistory {
    id: string;
    userId: string;
    prizeWon: SpinPrize;
    spinType: 'free' | 'ad' | 'purchased';
    timestamp: Timestamp;
}

export interface UserPrize {
    id: string;
    userId: string;
    prize: SpinPrize;
    status: 'unclaimed' | 'claimed';
    wonAt: Timestamp;
}

export interface RewardFulfillment {
    id: string;
    userId: string;
    userEmail: string;
    rewardId: string;
    rewardDetails: {
        name: string;
        coins: number;
    };
    status: 'pending' | 'fulfilled' | 'error';
    requestedAt: FieldValue;
    fulfilledAt?: FieldValue;
}

    