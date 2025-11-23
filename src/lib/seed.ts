import { collection, writeBatch, doc, Firestore } from 'firebase/firestore';
import { PlaceHolderImages } from './placeholder-images';

function getImage(id: string) {
  const image = PlaceHolderImages.find((img) => img.id === id);
  return image || { imageUrl: 'https://picsum.photos/seed/placeholder/400/300', imageHint: 'placeholder' };
}

const rewardsSeed = [
    {
        id: 'reward-1',
        name: '$5 Gift Card',
        description: 'A gift card for your favorite online store.',
        coins: 5000,
        isVipOnly: false,
    },
    {
        id: 'reward-2',
        name: '$10 Gift Card',
        description: 'Double the value, double the fun!',
        coins: 10000,
        isVipOnly: false,
    },
    {
        id: 'reward-3',
        name: 'Exclusive In-Game Item Pack',
        description: 'Get a treasure chest of exclusive items for your favorite game.',
        coins: 7500,
        isVipOnly: true,
    },
    {
        id: 'reward-4',
        name: '$25 VIP Gift Card',
        description: 'A special reward for our most loyal players.',
        coins: 20000,
        isVipOnly: true,
    },
];

const inAppPurchasesSeed = [
    // Spin Packs
    {
        id: 'spin-pack-1',
        type: 'spins',
        name: 'Spin Starter',
        description: 'A few spins to try your luck.',
        amount: 5,
        price: 0.99,
    },
    {
        id: 'spin-pack-2',
        type: 'spins',
        name: 'Spin Enthusiast',
        description: 'Best value for more chances to win big.',
        amount: 15,
        price: 1.99,
    },
    {
        id: 'spin-pack-3',
        type: 'spins',
        name: 'Spin Maniac',
        description: 'For the truly dedicated spinner.',
        amount: 50,
        price: 4.99,
    },
];


export async function seedDatabase(firestore: Firestore) {
  try {
    const batch = writeBatch(firestore);

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

    // Seed In-App Purchases (Spins only)
    const iapCollection = collection(firestore, 'inAppPurchases');
    console.log('Seeding spin packs...');
    const { imageUrl, imageHint } = getImage('spin-pack-image');
    for (const pack of inAppPurchasesSeed) {
        if (pack.type === 'spins') {
            const packRef = doc(iapCollection, pack.id);
            batch.set(packRef, {
                ...pack,
                imageUrl,
                imageHint,
            });
        }
    }
    console.log('Spin packs added to batch.');

    await batch.commit();
    console.log('Database seeded successfully with rewards and spin packs!');
    return { success: true, message: 'Database seeded successfully with rewards and spin packs!' };
  } catch (error) {
    console.error('Error seeding database:', error);
    return { success: false, message: 'Error seeding database.' };
  }
}
