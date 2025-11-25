
'use client';

import AppLayout from '@/components/layout/app-layout';
import type { AffiliateOffer, UserAffiliate } from '@/lib/data';
import AffiliateOfferCard from '@/components/app/affiliate-offer-card';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

export default function AffiliatePage() {
  const { firestore, user } = useFirebase();

  const offersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'affiliateOffers') : null),
    [firestore]
  );
  const { data: offers, isLoading: offersLoading } =
    useCollection<AffiliateOffer>(offersQuery);
    
  const userSubmissionsQuery = useMemoFirebase(
    () => (user && firestore ? collection(firestore, `users/${user.uid}/affiliateSignups`) : null),
    [user, firestore]
  );
  const { data: userSubmissions, isLoading: submissionsLoading } = useCollection<UserAffiliate>(userSubmissionsQuery);
  
  const isLoading = offersLoading || submissionsLoading;
  
  const twentyFourHoursAgo = useMemo(() => new Date(Date.now() - 24 * 60 * 60 * 1000), []);
  const oneWeekAgo = useMemo(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), []);

  const filteredOffers = useMemo(() => {
    if (!offers || !userSubmissions) return [];

    return offers.filter(offer => {
      const submission = userSubmissions.find(s => s.id === offer.id);

      if (submission) {
        if (submission.status === 'approved') {
          // If approved, check if it was approved more than 24 hours ago
          if (submission.approvedAt && submission.approvedAt.toDate() < twentyFourHoursAgo) {
            return false; // Hide old, completed offers
          }
        }
        // Always show pending or rejected offers, or recently approved ones
        return true;
      } else {
        // If no submission, check if the offer itself is too old
        const offerCreationDate = offer.createdAt?.toDate ? offer.createdAt.toDate() : new Date(0);
        if (offerCreationDate < oneWeekAgo) {
          return false; // Hide un-actioned offers older than a week
        }
      }
      
      return true; // Show offer
    });

  }, [offers, userSubmissions, twentyFourHoursAgo, oneWeekAgo]);


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
          : filteredOffers?.map((offer) => (
              <AffiliateOfferCard
                key={offer.id}
                offer={offer}
                userSubmission={userSubmissions?.find(s => s.id === offer.id)}
              />
            ))}
      </div>
    </AppLayout>
  );
}
