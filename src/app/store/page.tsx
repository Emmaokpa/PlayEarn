'use client';

import AppLayout from '@/components/layout/app-layout';
import type { StickerPack, UserProfile } from '@/lib/data';
import { useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import StickerPackCard from '@/components/app/sticker-pack-card';

export default function StorePage() {
  const { firestore, user } = useFirebase();

  const stickerPacksQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'stickerPacks') : null),
    [firestore]
  );
  const { data: stickerPacks, isLoading: stickerPacksLoading } =
    useCollection<StickerPack>(stickerPacksQuery);

  const userProfileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: userLoading } =
    useDoc<UserProfile>(userProfileRef);
  
  const isLoading = stickerPacksLoading || userLoading;

  return (
    <AppLayout title="Sticker Store">
      <div className="mb-8 text-center">
        <h2 className="font-headline text-3xl font-bold">Sticker Store</h2>
        <p className="mt-2 text-muted-foreground">
          Use your coins to buy exclusive digital stickers for Telegram.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))
          : stickerPacks?.map((pack) => (
              <StickerPackCard
                key={pack.id}
                pack={pack}
                userCoins={userProfile?.coins ?? 0}
              />
            ))}
      </div>
    </AppLayout>
  );
}

    