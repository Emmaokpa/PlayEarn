
'use server';

import { initializeFirebase } from '@/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { PlaceHolderImages } from './placeholder-images';

function getImage(id: string) {
  const image = PlaceHolderImages.find((img) => img.id === id);
  return image || { imageUrl: '', imageHint: 'placeholder' };
}

const gamesSeed = [
  {
    id: 'game-1',
    name: 'Nitro Racer',
    category: 'Racing',
    iframeUrl: 'https://playgama.com/embed/nitro-racer',
  },
  {
    id: 'game-2',
    name: 'Jungle Quest',
    category: 'Adventure',
    iframeUrl: 'https://playgama.com/embed/jungle-quest',
  },
  {
    id: 'game-3',
    name: 'Galaxy Wars',
    category: 'Sci-Fi',
    iframeUrl: 'https://playgama.com/embed/galaxy-wars',
  },
  {
    id: 'game-4',
    name: 'Block Master',
    category: 'Puzzle',
    iframeUrl: 'https://playgama.com/embed/block-master',
  },
  {
    id: 'game-5',
    name: "Dragon's Lair",
    category: 'Fantasy',
    iframeUrl: 'https://playgama.com/embed/dragons-lair',
  },
  {
    id: 'game-6',
    name: 'Checkmate',
    category: 'Strategy',
    iframeUrl: 'https://playgama.com/embed/checkmate',
  },
];

const rewardsSeed = [
  {
    id: 'reward-1',
    name: '$5 Gift Card',
    description: 'A gift card for a popular online store.',
    coins: 50000,
    isVipOnly: true,
  },
  {
    id: 'reward-2',
    name: '20% Off Coupon',
    description: 'A discount coupon for your next purchase.',
    coins: 1000,
    isVipOnly: false,
  },
  {
    id: 'reward-3',
    name: 'Epic Loot Box',
    description: 'Exclusive in-game item pack for your favorite game.',
    coins: 2500,
    isVipOnly: false,
  },
  {
    id: 'reward-4',
    name: '1-Month Premium',
    description: 'A premium subscription for a month on our platform.',
    coins: 10000,
    isVipOnly: false,
  },
];

const stickerPacksSeed = [
    {
        id: 'sticker-1',
        name: 'Cool Cats',
        description: 'A collection of cute and funny cat stickers.',
        price: 500,
    },
    {
        id: 'sticker-2',
        name: 'Meme Lords',
        description: 'The most popular memes, now as stickers.',
        price: 750,
    },
    {
        id: 'sticker-3',
        name: 'Pixel Power',
        description: '8-bit video game characters and items.',
        price: 400,
    },
    {
        id: 'sticker-4',
        name: 'Galaxy Explorers',
        description: 'Explore the cosmos with these space stickers.',
        price: 600,
    },
];

export async function seedDatabase() {
  const { firestore } = initializeFirebase();

  try {
    const batch = writeBatch(firestore);

    // Seed Games
    const gamesCollection = collection(firestore, 'games');
    console.log('Seeding games...');
    for (const game of gamesSeed) {
      const { imageUrl, imageHint } = getImage(game.id);
      const gameRef = doc(gamesCollection, game.id);
      batch.set(gameRef, {
        ...game,
        imageUrl,
        imageHint,
      });
    }
    console.log('Games added to batch.');

    // Seed Rewards
    const rewardsCollection = collection(firestore, 'rewards');
    console.log('Seeding rewards...');
    for (const reward of rewardsSeed) {
      const { imageUrl, imageHint } = getImage(reward.id);
      const rewardRef = doc(rewardsCollection, reward.id);
      batch.set(rewardRef, {
        ...reward,
        imageUrl,
        imageHint,
      });
    }
    console.log('Rewards added to batch.');

     // Seed Sticker Packs
    const stickerPacksCollection = collection(firestore, 'stickerPacks');
    console.log('Seeding sticker packs...');
    for (const pack of stickerPacksSeed) {
      const { imageUrl, imageHint } = getImage(pack.id);
      const packRef = doc(stickerPacksCollection, pack.id);
      batch.set(packRef, {
        ...pack,
        imageUrl,
        imageHint,
      });
    }
    console.log('Sticker packs added to batch.');

    await batch.commit();
    console.log('Database seeded successfully!');
    return { success: true, message: 'Database seeded successfully!' };
  } catch (error) {
    console.error('Error seeding database:', error);
    return { success: false, message: 'Error seeding database.' };
  }
}

    