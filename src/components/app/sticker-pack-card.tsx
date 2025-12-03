
'use client';

import type { StickerPack } from '@/lib/data';
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
import { CheckCircle, Star, Coins } from 'lucide-react';
import { useState } from 'react';

interface StickerPackCardProps {
  pack: StickerPack;
  userCoins: number;
}

export default function StickerPackCard({ pack }: StickerPackCardProps) {
  const { toast } = useToast();
  const [isBought, setIsBought] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  const priceDisplayText = pack.price.toLocaleString();

  const handleBuy = async () => {
    // All payment logic has been temporarily removed as requested.
    toast({
      variant: 'destructive',
      title: 'Feature Disabled',
      description: 'The payment feature is currently undergoing maintenance.',
    });
  };

  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="relative aspect-square">
          <Image
            src={pack.imageUrl}
            alt={pack.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            data-ai-hint={pack.imageHint}
            referrerPolicy="no-referrer"
            unoptimized
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-3">
        <CardTitle className="text-base truncate">{pack.name}</CardTitle>
        <CardDescription className="text-xs mt-1">{pack.description}</CardDescription>
      </CardContent>
      <CardFooter className="flex items-center justify-between bg-secondary/50 p-3">
        <div className="flex items-center gap-1 font-bold">
          <Coins className="h-4 w-4 text-primary" />
          <span>{priceDisplayText}</span>
        </div>
        <Button onClick={handleBuy} disabled size="sm">
          <Star className="h-4 w-4 mr-1" />
          Buy
        </Button>
      </CardFooter>
    </Card>
  );
}
