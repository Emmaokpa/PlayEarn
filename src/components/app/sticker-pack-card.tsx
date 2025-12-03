
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
import { Coins, CheckCircle, Star } from 'lucide-react';
import { useFirebase, useUser } from '@/firebase';
import { useState } from 'react';
import { initiateTelegramPayment } from '@/lib/telegram-payment';

interface StickerPackCardProps {
  pack: StickerPack;
  userCoins: number;
}

export default function StickerPackCard({ pack, userCoins }: StickerPackCardProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const [isBought, setIsBought] = useState(false); // In a real app, check against user's purchased packs
  const [isBuying, setIsBuying] = useState(false);

  const handleBuy = async () => {
    if (!user) {
      toast({
          variant: 'destructive',
          title: 'Not Logged In',
          description: 'You must be logged in to make a purchase.',
      });
      return;
    }

    setIsBuying(true);
    
    // Stickers are digital goods purchased with Telegram Stars.
    // Convert coin price to a USD equivalent then to Stars.
    const COIN_TO_USD_RATE = 0.001; // 1000 coins = $1
    const USD_TO_STARS_RATE = 113; // Approximate rate
    const priceInUsd = pack.price * COIN_TO_USD_RATE;
    // Ensure the price is at least 1 star
    const priceInStars = Math.max(1, Math.ceil(priceInUsd * USD_TO_STARS_RATE));

    const payload = {
        title: pack.name || 'Untitled Sticker Pack', // Ensure title is always a string
        description: pack.description || 'A unique sticker pack for your collection.', // Ensure description is always a string
        payload: `sticker-purchase-${user.uid}-${pack.id}-${Date.now()}`,
        currency: 'XTR',
        prices: [{ label: pack.name || 'Sticker Pack', amount: priceInStars }],
    };

    const result = await initiateTelegramPayment(payload);

    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: result.error || 'Could not initiate the payment process.',
      });
    } else {
        toast({
            title: 'Complete Your Purchase',
            description: `Follow the instructions from Telegram to buy the "${pack.name}" pack.`,
        });
    }
    
    // The webhook will handle the actual logic, so we don't set `isBought` here.
    setIsBuying(false);
  };

  const getPriceInStars = () => {
    const COIN_TO_USD_RATE = 0.001;
    const USD_TO_STARS_RATE = 113;
    const priceInUsd = pack.price * COIN_TO_USD_RATE;
    return Math.max(1, Math.ceil(priceInUsd * USD_TO_STARS_RATE));
  }

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
          <Star className="h-4 w-4 text-yellow-400" />
          <span>{getPriceInStars()}</span>
        </div>
        <Button onClick={handleBuy} disabled={isBought || isBuying} size="sm" className={isBought ? "bg-green-600 hover:bg-green-600" : ""}>
          {isBought ? <CheckCircle className="h-4 w-4" /> : null}
          {isBuying && 'Processing...'}
          {!isBuying && (isBought ? 'Owned' : 'Buy')}
        </Button>
      </CardFooter>
    </Card>
  );
}
