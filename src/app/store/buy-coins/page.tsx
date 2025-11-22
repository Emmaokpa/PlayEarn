
'use client';

import AppLayout from '@/components/layout/app-layout';
import type { InAppPurchase, UserProfile } from '@/lib/data';
import { useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import PurchasePackCard from '@/components/app/purchase-pack-card';

export default function BuyCoinsPage() {
  const { firestore, user } = useFirebase();

  const coinPacksQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'inAppPurchases'), where('type', '==', 'coins')) : null),
    [firestore]
  );
  const { data: coinPacks, isLoading: coinPacksLoading } =
    useCollection<InAppPurchase>(coinPacksQuery);

  const userProfileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: userLoading } =
    useDoc<UserProfile>(userProfileRef);
  
  const isLoading = coinPacksLoading || userLoading;

  return (
    <AppLayout title="Buy Coins">
      <div className="mb-8 text-center">
        <h2 className="font-headline text-3xl font-bold">Get More Coins</h2>
        <p className="mt-2 text-muted-foreground">
          Purchase a coin pack to boost your balance instantly.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))
          : coinPacks?.sort((a, b) => a.price - b.price).map((pack) => (
              <PurchasePackCard
                key={pack.id}
                pack={pack}
              />
            ))}
      </div>
    </AppLayout>
  );
}

    