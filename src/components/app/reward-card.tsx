
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
import { Coins, Crown } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { useFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment } from 'firebase/firestore';

interface RewardCardProps {
  reward: Reward;
  isUserVip: boolean;
  userCoins: number;
}

export default function RewardCard({
  reward,
  isUserVip,
  userCoins,
}: RewardCardProps) {
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const canAfford = userCoins >= reward.coins;
  const canRedeem = reward.isVipOnly ? isUserVip && canAfford : canAfford;

  const handleRedeem = () => {
    if (!user || !firestore) return;

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
    
    const userRef = doc(firestore, 'users', user.uid);
    updateDocumentNonBlocking(userRef, { coins: increment(-reward.coins) });

    // Here you would typically also create a record of the redemption
    // For example, in a `/users/{userId}/redeemedRewards` collection
    
    toast({
      title: 'Reward Redeemed!',
      description: `You've successfully redeemed "${reward.name}".`,
    });
  };

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
        <Button onClick={handleRedeem} disabled={!canRedeem}>
          Redeem
        </Button>
      </CardFooter>
    </Card>
  );
}

    