
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
}

export interface UserAffiliate {
    id: string;
    userId: string;
    offerId: string;
    completedAt: FieldValue;
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
