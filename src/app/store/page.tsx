
'use client';

import AppLayout from '@/components/layout/app-layout';
import type { InAppPurchase, StickerPack, UserProfile } from '@/lib/data';
import { useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import StickerPackCard from '@/components/app/sticker-pack-card';
import PurchasePackCard from '@/components/app/purchase-pack-card';
import { Button } from '@/components/ui/button';
import { Coins, Star, Laptop, Package } from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function Section({ title, description, icon: Icon, children, className }: { title: string, description: string, icon: React.ElementType, children: React.ReactNode, className?: string }) {
    return (
        <div className={className}>
            <div className="mb-6 text-center">
                <Icon className="mx-auto h-10 w-10 text-primary mb-2" />
                <h3 className="text-2xl font-bold font-headline">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
            {children}
        </div>
    )
}

export default function StorePage() {
  const { firestore, user } = useFirebase();

  const packsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'inAppPurchases') : null),
    [firestore]
  );
  const { data: allPacks, isLoading: packsLoading } = useCollection<InAppPurchase>(packsQuery);

  const coinPacks = allPacks?.filter(p => p.type === 'coins').sort((a,b) => a.price - b.price) ?? [];
  const spinPacks = allPacks?.filter(p => p.type === 'spins').sort((a,b) => a.price - b.price) ?? [];


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
  
  const isLoading = stickerPacksLoading || userLoading || packsLoading;

  return (
    <AppLayout title="Store">
      <div className="space-y-12">
        <div className="text-center">
          <h2 className="font-headline text-3xl font-bold">In-App Store</h2>
          <p className="mt-2 text-muted-foreground">
            Get more coins, spins, and cool digital or physical items.
          </p>
        </div>
        
        <Section title="In-App Currency" description="Boost your balance to keep the fun going." icon={Coins}>
             <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {isLoading ? (
                    <>
                        <Skeleton className="h-64" />
                        <Skeleton className="h-64" />
                    </>
                ) : (
                    <>
                        {coinPacks.map((pack) => <PurchasePackCard key={pack.id} pack={pack} />)}
                        {spinPacks.map((pack) => <PurchasePackCard key={pack.id} pack={pack} />)}
                    </>
                )}
            </div>
        </Section>
        
        <Section title="Digital Goods" description="Personalize your experience with these items." icon={Package}>
             <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
        </Section>

        <Section title="Physical Goods" description="Use your earnings to get real-world items." icon={Laptop}>
            <Card className="flex flex-col items-center justify-center py-16 text-center bg-secondary/50 border-dashed">
                <CardHeader>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                        <Laptop className="h-8 w-8 text-secondary-foreground" />
                    </div>
                    <CardTitle className="mt-4">Coming Soon!</CardTitle>
                    <CardDescription>
                        Gadgets, watches, and more will be available here. Stay tuned!
                    </CardDescription>
                </CardHeader>
            </Card>
        </Section>

      </div>
    </AppLayout>
  );
}
