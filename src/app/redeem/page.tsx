'use client';

import AppLayout from '@/components/layout/app-layout';
import type { Reward, UserProfile } from '@/lib/data';
import RewardCard from '@/components/app/reward-card';
import { useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function RedeemPage() {
  const { firestore, user } = useFirebase();

  const rewardsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'rewards') : null),
    [firestore]
  );
  const { data: rewards, isLoading: rewardsLoading } =
    useCollection<Reward>(rewardsQuery);

  const userProfileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: userLoading } =
    useDoc<UserProfile>(userProfileRef);

  const isLoading = rewardsLoading || userLoading;

  return (
    <AppLayout title="Redeem Rewards">
      <div className="mb-8 text-center">
        <h2 className="font-headline text-3xl font-bold">Your Rewards Store</h2>
        <p className="mt-2 text-muted-foreground">
          Use your coins to claim awesome rewards.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))
          : rewards?.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                isUserVip={userProfile?.isVip ?? false}
                userCoins={userProfile?.coins ?? 0}
              />
            ))}
      </div>
    </AppLayout>
  );
}
