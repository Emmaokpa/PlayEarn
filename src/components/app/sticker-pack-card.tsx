
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
import { useFirebase } from '@/firebase';
import { useState } from 'react';
import { initiateTelegramPayment } from '@/lib/telegram-payment';

interface StickerPackCardProps {
  pack: StickerPack;
  userCoins: number;
}

export default function StickerPackCard({ pack }: StickerPackCardProps) {
  const { toast } = useToast();
  const { user } = useFirebase();
  const [isBought, setIsBought] = useState(false); // In a real app, check against user's purchased packs
  const [isBuying, setIsBuying] = useState(false);

  // Note: Price in Stars is now calculated on the backend.
  // The price shown here is in game coins.
  const priceDisplayText = pack.price.toLocaleString();

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
    
    // Frontend now only needs to send the product ID and its type.
    const payload = {
        productId: pack.id,
        purchaseType: 'sticker-purchase',
    };

    const result = await initiateTelegramPayment(payload, user.uid);

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
    
    setIsBuying(false);
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
        <Button onClick={handleBuy} disabled={isBought || isBuying} size="sm" className={isBought ? "bg-green-600 hover:bg-green-600" : ""}>
          {isBought ? <CheckCircle className="h-4 w-4" /> : <Star className="h-4 w-4 mr-1" />}
          {isBuying && '...'}
          {!isBuying && (isBought ? 'Owned' : 'Buy')}
        </Button>
      </CardFooter>
    </Card>
  );
}
