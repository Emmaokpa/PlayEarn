
'use client';

import AppLayout from '@/components/layout/app-layout';
import type { AffiliateOffer, UserProfile } from '@/lib/data';
import AffiliateOfferCard from '@/components/app/affiliate-offer-card';
import { useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function AffiliatePage() {
  const { firestore, user } = useFirebase();

  const offersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'affiliateOffers') : null),
    [firestore]
  );
  const { data: offers, isLoading: offersLoading } =
    useCollection<AffiliateOffer>(offersQuery);

  const userProfileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: userLoading } =
    useDoc<UserProfile>(userProfileRef);
    
  // In a real app, you'd also fetch the user's completed offers to disable completed cards
  const completedOffers: string[] = []; // Placeholder

  const isLoading = offersLoading || userLoading;

  return (
    <AppLayout title="Affiliate Offers">
      <div className="mb-8 text-center">
        <h2 className="font-headline text-3xl font-bold">Earn Big with Offers</h2>
        <p className="mt-2 text-muted-foreground">
          Complete these offers from our partners to earn huge coin rewards.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-96 rounded-lg" />
            ))
          : offers?.map((offer) => (
              <AffiliateOfferCard
                key={offer.id}
                offer={offer}
                userCoins={userProfile?.coins ?? 0}
                isCompleted={completedOffers.includes(offer.id)}
              />
            ))}
      </div>
    </AppLayout>
  );
}

    