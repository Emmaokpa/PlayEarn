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
import { Coin } from 'lucide-react';

export default function RewardCard({ reward }: { reward: Reward }) {
  const { toast } = useToast();
  const canAfford = mockUser.points >= reward.points;

  const handleRedeem = () => {
    if (!canAfford) {
      toast({
        variant: 'destructive',
        title: 'Not enough coins!',
        description: `You need ${
          reward.points - mockUser.points
        } more coins to redeem this.`,
      });
      return;
    }

    // In a real app, this would be a server action to deduct points
    toast({
      title: 'Reward Redeemed!',
      description: `You've successfully redeemed "${reward.name}".`,
    });
  };

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-lg">
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
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <CardTitle>{reward.name}</CardTitle>
        <CardDescription className="mt-2">{reward.description}</CardDescription>
      </CardContent>
      <CardFooter className="flex justify-between items-center p-4 bg-secondary/50 rounded-b-lg">
        <div className="flex items-center gap-1 font-bold text-lg">
          <Coin className="h-5 w-5 text-primary" />
          <span>{reward.points.toLocaleString()}</span>
        </div>
        <Button onClick={handleRedeem} disabled={!canAfford}>
          Redeem
        </Button>
      </CardFooter>
    </Card>
  );
}
