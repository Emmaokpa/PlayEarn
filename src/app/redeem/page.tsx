
'use client';

import { useState, useMemo } from 'react';
import AppLayout from '@/components/layout/app-layout';
import type { Reward, UserProfile } from '@/lib/data';
import RewardCard from '@/components/app/reward-card';
import { useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Filter, Info } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

type SortOption = 'coins-asc' | 'coins-desc';
type TypeFilter = 'all' | 'virtual' | 'physical';

export default function RedeemPage() {
  const { firestore, user } = useFirebase();
  const [sortOption, setSortOption] = useState<SortOption>('coins-asc');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [showVipOnly, setShowVipOnly] = useState(false);

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

  const filteredAndSortedRewards = useMemo(() => {
    if (!rewards) return [];
    
    return rewards
      .filter((reward) => {
        if (typeFilter !== 'all' && reward.type !== typeFilter) {
          return false;
        }
        if (showVipOnly && !reward.isVipOnly) {
            return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'coins-asc') {
          return a.coins - b.coins;
        } else {
          return b.coins - a.coins;
        }
      });
  }, [rewards, sortOption, typeFilter, showVipOnly]);

  return (
    <AppLayout title="Redeem Rewards">
      <div className="mb-8 text-center">
        <h2 className="font-headline text-3xl font-bold">Your Rewards Store</h2>
        <p className="mt-2 text-muted-foreground">
          Use your coins to claim awesome rewards.
        </p>
      </div>

      <Alert className="mb-8 border-primary/30 bg-primary/10">
        <Info className="h-4 w-4" />
        <AlertTitle className="font-bold">How Rewards Work</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
            <li><b>1,000 coins = $1.00 USD</b></li>
            <li>Minimum redemption is 1,500 coins ($1.50).</li>
            <li>A 10% service fee applies to all cash reward redemptions.</li>
            <li>Play more games and complete offers to earn coins faster!</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Card className="mb-8">
        <CardHeader className="pb-4">
            <div className="flex items-center gap-2 font-semibold">
                <Filter className="h-5 w-5"/>
                <span>Filter & Sort</span>
            </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                <div className="space-y-2">
                    <Label htmlFor="sort-by">Sort by Cost</Label>
                    <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                        <SelectTrigger id="sort-by"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="coins-asc">Low to High</SelectItem>
                            <SelectItem value="coins-desc">High to Low</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="filter-type">Filter by Type</Label>
                    <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
                        <SelectTrigger id="filter-type"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="virtual">Virtual</SelectItem>
                            <SelectItem value="physical">Physical</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-end">
                    <div className="flex items-center space-x-2 rounded-md border p-3">
                        <Switch id="vip-only" checked={showVipOnly} onCheckedChange={setShowVipOnly} />
                        <Label htmlFor="vip-only" className="cursor-pointer">Show VIP Only</Label>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))
          : filteredAndSortedRewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                isUserVip={userProfile?.isVip ?? false}
                userCoins={userProfile?.coins ?? 0}
              />
            ))}
      </div>
      {!isLoading && filteredAndSortedRewards.length === 0 && (
        <div className="col-span-full text-center text-muted-foreground py-16">
            <p>No rewards match your current filters.</p>
        </div>
      )}
    </AppLayout>
  );
}
