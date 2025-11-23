import { collection, writeBatch, doc, Firestore } from 'firebase/firestore';
import { PlaceHolderImages } from './placeholder-images';

function getImage(id: string) {
  const image = PlaceHolderImages.find((img) => img.id === id);
  return image || { imageUrl: 'https://picsum.photos/seed/placeholder/400/300', imageHint: 'placeholder' };
}

const affiliateOffersSeed = [
    {
        id: 'offer-1',
        title: 'BC.Game Sign Up',
        description: 'Sign up for this awesome service and get a huge bonus.',
        link: 'https://bc.game',
        rewardCoins: 10000,
    },
    {
        id: 'offer-2',
        title: 'Stake.com Registration',
        description: 'Join the leading crypto casino and claim your welcome offer.',
        link: 'https://stake.com',
        rewardCoins: 12000,
    },
    {
        id: 'offer-3',
        title: 'Complete a Survey',
        description: 'Share your opinion and earn coins for your time.',
        link: '#',
        rewardCoins: 500,
    },
];

const stickerPacksSeed = [
    {
        id: 'sticker-1',
        name: 'Cool Cats',
        description: 'A pack of cool and funny cat stickers.',
        price: 500,
    },
    {
        id: 'sticker-2',
        name: 'Meme Lords',
        description: 'A collection of the most popular meme reactions.',
        price: 750,
    },
    {
        id: 'sticker-3',
        name: 'Pixel Power',
        description: 'Retro pixel art characters and items.',
        price: 600,
    },
    {
        id: 'sticker-4',
        name: 'Galaxy Explorers',
        description: 'Vibrant space and galaxy-themed stickers.',
        price: 800,
    },
];

export async function seedDatabase(firestore: Firestore) {
  try {
    const batch = writeBatch(firestore);

    // Seed Affiliate Offers
    const offersCollection = collection(firestore, 'affiliateOffers');
    console.log('Seeding affiliate offers...');
    for (const offer of affiliateOffersSeed) {
        const { imageUrl, imageHint } = getImage(offer.id);
        const offerRef = doc(offersCollection, offer.id);
        batch.set(offerRef, {
            ...offer,
            imageUrl,
            imageHint,
        });
    }
    console.log('Affiliate offers added to batch.');

    // Seed Sticker Packs
    const stickersCollection = collection(firestore, 'stickerPacks');
    console.log('Seeding sticker packs...');
    for (const pack of stickerPacksSeed) {
        const { imageUrl, imageHint } = getImage(pack.id);
        const packRef = doc(stickersCollection, pack.id);
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
