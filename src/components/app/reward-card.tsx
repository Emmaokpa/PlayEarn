
'use client';

import type { Reward } from '@/lib/data';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Coins, Crown, Loader2, CheckCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { useFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, increment, setDoc, collection, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useState } from 'react';

interface RewardCardProps {
  reward: Reward;
  isUserVip: boolean;
  userCoins: number;
}

type RedeemState = 'idle' | 'loading' | 'success';

export default function RewardCard({
  reward,
  isUserVip,
  userCoins,
}: RewardCardProps) {
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [redeemState, setRedeemState] = useState<RedeemState>('idle');

  const canAfford = userCoins >= reward.coins;
  const canRedeem = reward.isVipOnly ? isUserVip && canAfford : canAfford;

  const handleRedeem = async () => {
    if (!user || !firestore || redeemState !== 'idle') return;

    if (reward.isVipOnly && !isUserVip) {
      toast({
        variant: 'destructive',
        title: 'VIP Exclusive Reward',
        description: 'This reward is only available for VIP members.',
      });
      return;
    }

    if (!canAfford) {
      toast({
        variant: 'destructive',
        title: 'Not enough coins!',
        description: `You need ${
          reward.coins - userCoins
        } more coins to redeem this.`,
      });
      return;
    }

    setRedeemState('loading');
    
    try {
        const batch = writeBatch(firestore);

        // 1. Deduct coins from the user's profile
        const userRef = doc(firestore, 'users', user.uid);
        batch.update(userRef, { coins: increment(-reward.coins) });

        // 2. If it's a physical reward, create a fulfillment request
        if (reward.type === 'physical') {
            const fulfillmentRef = doc(collection(firestore, 'fulfillments'));
            const fulfillmentData = {
                id: fulfillmentRef.id,
                userId: user.uid,
                userEmail: user.email, // This was the critical missing piece
                rewardId: reward.id,
                rewardDetails: { name: reward.name, coins: reward.coins },
                status: 'pending' as const,
                requestedAt: serverTimestamp(),
            };
            batch.set(fulfillmentRef, fulfillmentData);
        }

        // Atomically commit both operations
        await batch.commit();

        setRedeemState('success');
        toast({
            title: 'Redemption successful!',
            description: reward.type === 'physical' 
              ? `Your request for "${reward.name}" is being processed.`
              : `You've successfully redeemed "${reward.name}".`,
        });

        setTimeout(() => {
            setRedeemState('idle');
        }, 3000);

    } catch (serverError) {
        console.error("Redemption failed:", serverError);
        // If the batch fails, emit a detailed error for debugging
        const permissionError = new FirestorePermissionError({
            path: `/fulfillments/ (or /users/${user.uid})`,
            operation: 'write',
            requestResourceData: {
              coinDeduction: -reward.coins,
              fulfillmentRequest: reward.type === 'physical' ? 'Attempted to create' : 'N/A'
            },
        });
        errorEmitter.emit('permission-error', permissionError);

        setRedeemState('idle');
        toast({
            variant: 'destructive',
            title: 'Redemption Failed',
            description: 'Something went wrong. Your coins have not been deducted.',
        });
    }
  };
  
  const getButtonContent = () => {
    switch (redeemState) {
        case 'loading':
            return <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>;
        case 'success':
            return <><CheckCircle className="mr-2 h-4 w-4" />Success!</>;
        default:
            return 'Redeem';
    }
  }

  return (
    <Card
      className={cn(
        'flex flex-col transition-shadow hover:shadow-lg',
        reward.isVipOnly && !isUserVip && 'opacity-70'
      )}
    >
      <CardHeader className="p-0">
        <div className="relative aspect-video">
          <Image
            src={reward.imageUrl}
            alt={reward.name}
            fill
            className="rounded-t-lg object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            data-ai-hint={reward.imageHint}
            referrerPolicy="no-referrer"
            unoptimized
          />
          {reward.isVipOnly && (
            <Badge
              variant="default"
              className="absolute right-2 top-2 bg-primary text-primary-foreground"
            >
              <Crown className="mr-1 h-3 w-3" />
              VIP Only
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <CardTitle>{reward.name}</CardTitle>
        <CardDescription className="mt-2">{reward.description}</CardDescription>
      </CardContent>
      <CardFooter className="flex items-center justify-between rounded-b-lg bg-secondary/50 p-4">
        <div className="flex items-center gap-1 text-lg font-bold">
          <Coins className="h-5 w-5 text-primary" />
          <span>{reward.coins.toLocaleString()}</span>
        </div>
        <Button 
            onClick={handleRedeem} 
            disabled={!canRedeem || redeemState !== 'idle'}
            className={cn(redeemState === 'success' && 'bg-green-600 hover:bg-green-600')}
        >
          {getButtonContent()}
        </Button>
      </CardFooter>
    </Card>
  );
}
