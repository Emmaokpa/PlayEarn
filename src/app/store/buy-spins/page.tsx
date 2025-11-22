
'use client';

import AppLayout from '@/components/layout/app-layout';
import type { InAppPurchase } from '@/lib/data';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import PurchasePackCard from '@/components/app/purchase-pack-card';

export default function BuySpinsPage() {
  const { firestore } = useFirebase();

  const spinPacksQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'inAppPurchases'), where('type', '==', 'spins')) : null),
    [firestore]
  );
  const { data: spinPacks, isLoading: spinPacksLoading } =
    useCollection<InAppPurchase>(spinPacksQuery);
  
  const isLoading = spinPacksLoading;

  return (
    <AppLayout title="Buy Spins">
      <div className="mb-8 text-center">
        <h2 className="font-headline text-3xl font-bold">Get More Spins</h2>
        <p className="mt-2 text-muted-foreground">
          Purchase a spin pack for more chances to win big!
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))
          : spinPacks?.sort((a, b) => a.price - b.price).map((pack) => (
              <PurchasePackCard
                key={pack.id}
                pack={pack}
              />
            ))}
      </div>
    </AppLayout>
  );
}

    