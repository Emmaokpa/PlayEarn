
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
}

export interface StickerPack {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  imageHint: string;
}

    
