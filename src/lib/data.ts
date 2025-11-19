import { PlaceHolderImages } from './placeholder-images';

function getImage(id: string) {
  const image = PlaceHolderImages.find((img) => img.id === id);
  return image || { imageUrl: '', imageHint: 'placeholder' };
}

export interface Game {
  id: string;
  name: string;
  category: string;
  iframeUrl: string;
  imageUrl: string;
  imageHint: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  points: number;
  imageUrl: string;
  imageHint: string;
}

export interface User {
  name: string;
  avatarUrl: string;
  points: number;
  referralCode: string;
  progress: {
    gameId: string;
    value: number;
  }[];
}

export const mockUser: User = {
  name: 'Alex',
  avatarUrl: 'https://picsum.photos/seed/user/100/100',
  points: 1250,
  referralCode: 'ALEX2077',
  progress: [
    { gameId: 'game-1', value: 75 },
    { gameId: 'game-3', value: 50 },
  ],
};

export const games: Game[] = [
  {
    id: 'game-1',
    name: 'Nitro Racer',
    category: 'Racing',
    iframeUrl: 'https://playgama.com/embed/nitro-racer',
    imageUrl: getImage('game-1').imageUrl,
    imageHint: getImage('game-1').imageHint,
  },
  {
    id: 'game-2',
    name: 'Jungle Quest',
    category: 'Adventure',
    iframeUrl: 'https://playgama.com/embed/jungle-quest',
    imageUrl: getImage('game-2').imageUrl,
    imageHint: getImage('game-2').imageHint,
  },
  {
    id: 'game-3',
    name: 'Galaxy Wars',
    category: 'Sci-Fi',
    iframeUrl: 'https://playgama.com/embed/galaxy-wars',
    imageUrl: getImage('game-3').imageUrl,
    imageHint: getImage('game-3').imageHint,
  },
  {
    id: 'game-4',
    name: 'Block Master',
    category: 'Puzzle',
    iframeUrl: 'https://playgama.com/embed/block-master',
    imageUrl: getImage('game-4').imageUrl,
    imageHint: getImage('game-4').imageHint,
  },
  {
    id: 'game-5',
    name: "Dragon's Lair",
    category: 'Fantasy',
    iframeUrl: 'https://playgama.com/embed/dragons-lair',
    imageUrl: getImage('game-5').imageUrl,
    imageHint: getImage('game-5').imageHint,
  },
  {
    id: 'game-6',
    name: 'Checkmate',
    category: 'Strategy',
    iframeUrl: 'https://playgama.com/embed/checkmate',
    imageUrl: getImage('game-6').imageUrl,
    imageHint: getImage('game-6').imageHint,
  },
];

export const rewards: Reward[] = [
  {
    id: 'reward-1',
    name: '$5 Gift Card',
    description: 'A gift card for a popular online store.',
    points: 5000,
    imageUrl: getImage('reward-1').imageUrl,
    imageHint: getImage('reward-1').imageHint,
  },
  {
    id: 'reward-2',
    name: '20% Off Coupon',
    description: 'A discount coupon for your next purchase.',
    points: 1000,
    imageUrl: getImage('reward-2').imageUrl,
    imageHint: getImage('reward-2').imageHint,
  },
  {
    id: 'reward-3',
    name: 'Epic Loot Box',
    description: 'Exclusive in-game item pack for your favorite game.',
    points: 2500,
    imageUrl: getImage('reward-3').imageUrl,
    imageHint: getImage('reward-3').imageHint,
  },
  {
    id: 'reward-4',
    name: '1-Month Premium',
    description: 'A premium subscription for a month on our platform.',
    points: 10000,
    imageUrl: getImage('reward-4').imageUrl,
    imageHint: getImage('reward-4').imageHint,
  },
];
