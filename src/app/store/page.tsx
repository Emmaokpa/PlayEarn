
'use client';

import AppLayout from '@/components/layout/app-layout';
import type { StickerPack, UserProfile } from '@/lib/data';
import { useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import StickerPackCard from '@/components/app/sticker-pack-card';
import { Button } from '@/components/ui/button';
import { Coins } from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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
    <AppLayout title="Store">
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="font-headline text-3xl font-bold">In-App Store</h2>
          <p className="mt-2 text-muted-foreground">
            Spend your coins on cool stuff or buy more to keep the fun going.
          </p>
        </div>
        
        <Card className="bg-primary/10">
            <CardHeader className="text-center">
                <CardTitle>Need More Coins?</CardTitle>
                <CardDescription>
                    Don't wait to earn, get a coin pack and unlock rewards instantly!
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
                 <Button asChild size="lg">
                    <Link href="/store/buy-coins">
                        <Coins className="mr-2 h-5 w-5" />
                        Buy Coins
                    </Link>
                </Button>
            </CardContent>
        </Card>

        <div>
            <h3 className="mb-4 text-center text-2xl font-bold font-headline">Sticker Packs</h3>
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
        </div>
      </div>
    </AppLayout>
  );
}

    