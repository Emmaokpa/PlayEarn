
'use client';

import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Trophy, Users, Copy, Check, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import WatchAdDialog from '@/components/app/watch-ad-dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import type { UserProfile, AdView } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';

const AD_REWARD = 100;
const REGULAR_AD_LIMIT = 10;
const VIP_AD_LIMIT = 50;
const AD_COOLDOWN_MINUTES = 5;

export default function EarnPage() {
  const [isAdDialogOpen, setIsAdDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [adStatus, setAdStatus] = useState({
    canWatch: false,
    message: 'Loading ad status...',
  });
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const userProfileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  // Query for today's ad views
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const adViewsQuery = useMemoFirebase(
    () =>
      user && firestore
        ? query(
            collection(firestore, 'users', user.uid, 'adViews'),
            where('timestamp', '>=', today),
            orderBy('timestamp', 'desc')
          )
        : null,
    [user, firestore, today.getTime()] // Re-run when day changes
  );
  const { data: adViews, isLoading: areAdsLoading } = useCollection<AdView>(adViewsQuery);

  const isVip = userProfile?.isVip ?? false;
  const referralReward = isVip ? 3000 : 1000;
  const isLoading = isProfileLoading || areAdsLoading;
  
  useEffect(() => {
    if (isLoading || !adViews || !userProfile) {
      setAdStatus({ canWatch: false, message: 'Loading status...' });
      return;
    }

    const adLimit = userProfile.isVip ? VIP_AD_LIMIT : REGULAR_AD_LIMIT;
    const adsWatchedToday = adViews.length;

    if (adsWatchedToday >= adLimit) {
      setAdStatus({ canWatch: false, message: `Daily ad limit reached (${adsWatchedToday}/${adLimit})` });
      return;
    }

    if (!userProfile.isVip && adViews.length > 0) {
      const lastAdTime = adViews[0].timestamp; // Already a Date object
      const now = new Date();
      const diffMinutes = (now.getTime() - lastAdTime.getTime()) / (1000 * 60);

      if (diffMinutes < AD_COOLDOWN_MINUTES) {
        const minutesLeft = Math.ceil(AD_COOLDOWN_MINUTES - diffMinutes);
        setAdStatus({ canWatch: false, message: `Next ad available in ${minutesLeft} min` });
        return;
      }
    }
    
    setAdStatus({ canWatch: true, message: `Ads watched today: ${adsWatchedToday}/${adLimit}` });

  }, [adViews, userProfile, isLoading]);


  const handleCopy = () => {
    if (!userProfile?.referralCode) return;
    navigator.clipboard.writeText(userProfile.referralCode);
    setCopied(true);
    toast({
      title: 'Copied to clipboard!',
      description: 'Share your code with friends to earn rewards.',
    });
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleAdComplete = async () => {
    if (!firestore || !user) return;
    
    const batch = writeBatch(firestore);

    // 1. Give coins
    const userRef = doc(firestore, 'users', user.uid);
    batch.update(userRef, { coins: increment(AD_REWARD) });

    // 2. Record the ad view
    const adViewRef = doc(collection(firestore, `users/${user.uid}/adViews`));
    batch.set(adViewRef, {
        userId: user.uid,
        adId: 'earn-page-ad',
        timestamp: serverTimestamp(),
    });
    
    try {
        await batch.commit();
        toast({
            title: 'Reward Claimed!',
            description: `You earned ${AD_REWARD} coins.`,
        });
    } catch (error) {
        console.error("Error claiming ad reward:", error);
        toast({
            variant: 'destructive',
            title: 'Claim Failed',
            description: 'Could not claim your reward. Please try again.',
        });
    }
  }


  if (isLoading) {
    return (
      <AppLayout title="Earn">
        <div className="space-y-6">
          <div className="text-center">
            <Skeleton className="h-9 w-64 mx-auto" />
            <Skeleton className="h-5 w-80 mx-auto mt-2" />
          </div>
          <div className="mx-auto max-w-lg space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Earn">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="font-headline text-3xl font-bold">
            More Ways to Earn
          </h2>
          <p className="mt-2 text-muted-foreground">
            Complete tasks to collect more reward coins.
          </p>
        </div>

        <div className="mx-auto max-w-lg space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Trophy className="h-8 w-8 text-accent" />
                Watch & Earn
              </CardTitle>
              <CardDescription className="pt-2">
                Watch a short video ad and get rewarded with {AD_REWARD} coins
                instantly!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="lg"
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => setIsAdDialogOpen(true)}
                disabled={!adStatus.canWatch}
              >
                Watch Video Ad
              </Button>
               <p className="mt-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                <Info className="h-4 w-4" />
                {adStatus.message}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Users className="h-8 w-8 text-accent" />
                Refer a Friend
              </CardTitle>
              <CardDescription className="pt-2">
                Invite a friend with your code and you both get{' '}
                <span className="font-bold text-primary">
                  {referralReward.toLocaleString()} coins
                </span>
                !
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your referral code:
              </p>
              <div className="flex gap-2">
                <div className="flex-grow select-all rounded-md border border-dashed border-border bg-secondary/50 px-4 py-2 text-center font-mono text-lg tracking-widest text-secondary-foreground">
                  {userProfile?.referralCode ?? '...'}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0"
                  aria-label="Copy referral code"
                  disabled={!userProfile?.referralCode}
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <WatchAdDialog
        open={isAdDialogOpen}
        onOpenChange={setIsAdDialogOpen}
        onAdComplete={handleAdComplete}
        reward={AD_REWARD}
      />
    </AppLayout>
  );
}
