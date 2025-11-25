
'use client';

import AppLayout from '@/components/layout/app-layout';
import type { StickerPack, UserProfile } from '@/lib/data';
import { useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import StickerPackCard from '@/components/app/sticker-pack-card';
import { Package } from 'lucide-react';

export default function DigitalGoodsPage() {
  const { firestore, user } = useFirebase();

  const stickerPacksQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'stickerPacks') : null),
    [firestore]
  );
  const { data: stickerPacks, isLoading: stickerPacksLoading } = useCollection<StickerPack>(stickerPacksQuery);

  const userProfileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: userLoading } = useDoc<UserProfile>(userProfileRef);
  
  const isLoading = stickerPacksLoading || userLoading;

  return (
    <AppLayout title="Digital Goods">
      <div className="space-y-12">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-primary mb-4" />
          <h2 className="font-headline text-3xl font-bold">Digital Goods</h2>
          <p className="mt-2 text-muted-foreground">
            Personalize your experience with these virtual items.
          </p>
        </div>
        
        <div>
            <h3 className="text-2xl font-bold font-headline mb-6 text-center">Sticker Packs</h3>
             <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
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
             {(!isLoading && stickerPacks?.length === 0) && (
                <p className="text-center text-muted-foreground py-8">No sticker packs available at the moment.</p>
             )}
        </div>
      </div>
    </AppLayout>
  );
}
