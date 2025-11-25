
'use client';

import AppLayout from '@/components/layout/app-layout';
import type { AffiliateOffer, UserProfile, UserAffiliate } from '@/lib/data';
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
    
  const userSubmissionsQuery = useMemoFirebase(
    () => (user && firestore ? collection(firestore, `users/${user.uid}/affiliateSignups`) : null),
    [user, firestore]
  );
  const { data: userSubmissions, isLoading: submissionsLoading } = useCollection<{status: string}>(userSubmissionsQuery);

  const completedOffers = useMemoFirebase(
      () => userSubmissions?.filter(s => s.status === 'approved').map(s => s.id) ?? [],
      [userSubmissions]
  ) as string[];

  const pendingOffers = useMemoFirebase(
      () => userSubmissions?.filter(s => s.status === 'pending').map(s => s.id) ?? [],
      [userSubmissions]
  ) as string[];
  
  const isLoading = offersLoading || userLoading || submissionsLoading;

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
                userProfile={userProfile}
                completedOffers={completedOffers}
                pendingOffers={pendingOffers}
              />
            ))}
      </div>
    </AppLayout>
  );
}
