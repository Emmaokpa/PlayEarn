
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
  name: string;
  avatarUrl: string;
  coins: number;
  referralCode: string;
  isVip: boolean;
}
