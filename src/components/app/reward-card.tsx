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
import { mockUser } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Coins, Crown } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

interface RewardCardProps {
  reward: Reward;
  isVipOnly?: boolean;
  isUserVip?: boolean;
}

export default function RewardCard({
  reward,
  isVipOnly,
  isUserVip,
}: RewardCardProps) {
  const { toast } = useToast();
  const canAfford = mockUser.coins >= reward.coins;
  const canRedeem = isVipOnly ? isUserVip && canAfford : canAfford;

  const handleRedeem = () => {
    if (isVipOnly && !isUserVip) {
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
          reward.coins - mockUser.coins
        } more coins to redeem this.`,
      });
      return;
    }

    // In a real app, this would be a server action to deduct coins
    toast({
      title: 'Reward Redeemed!',
      description: `You've successfully redeemed "${reward.name}".`,
    });
  };

  return (
    <Card
      className={cn(
        'flex flex-col transition-shadow hover:shadow-lg',
        isVipOnly && !isUserVip && 'bg-secondary/50 opacity-70'
      )}
    >
      <CardHeader className="p-0">
        <div className="relative aspect-video">
          <Image
            src={reward.imageUrl}
            alt={reward.name}
            fill
            className="object-cover rounded-t-lg"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            data-ai-hint={reward.imageHint}
          />
          {isVipOnly && (
            <Badge
              variant="default"
              className="absolute top-2 right-2 bg-primary text-primary-foreground"
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
      <CardFooter className="flex justify-between items-center p-4 bg-secondary/50 rounded-b-lg">
        <div className="flex items-center gap-1 font-bold text-lg">
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
