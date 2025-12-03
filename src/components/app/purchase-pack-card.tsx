
'use client';

import type { InAppPurchase } from '@/lib/data';
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
import { Coins, Gem, Star } from 'lucide-react';
import { useFirebase } from '@/firebase';
import Image from 'next/image';
import { initiateTelegramPayment } from '@/lib/telegram-payment';
import { useState } from 'react';


interface PurchasePackCardProps {
  pack: InAppPurchase;
}

export default function PurchasePackCard({ pack }: PurchasePackCardProps) {
  const { toast } = useToast();
  const { user } = useFirebase();
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

    const payload = {
      type: pack.type, // 'coins' or 'spins'
      userId: user.uid,
      productId: pack.id,
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
        description: 'Follow the instructions from Telegram to complete your purchase.',
      });
    }
    
    setIsBuying(false);
  };

  const getIcon = () => {
    switch (pack.type) {
        case 'coins':
            return <Coins className="h-10 w-10" />;
        case 'spins':
            return <Star className="h-10 w-10" />;
        default:
            return <Gem className="h-10 w-10" />;
    }
  }

  const getPriceDisplay = () => {
      const USD_TO_STARS_RATE = 113;
      const priceInStars = Math.max(1, Math.ceil(pack.price * USD_TO_STARS_RATE));
      return (
          <div className="flex items-center gap-1">
              <Star className="h-5 w-5 text-yellow-400" />
              <span>{priceInStars.toLocaleString()}</span>
          </div>
      )
  }

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg hover:border-primary">
       {pack.imageUrl ? (
         <CardHeader className="p-0">
           <div className="relative aspect-video">
             <Image
              src={pack.imageUrl}
              alt={pack.name}
              fill
              className="rounded-t-lg object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              referrerPolicy="no-referrer"
              unoptimized
            />
           </div>
         </CardHeader>
      ) : (
        <CardHeader>
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                    <Gem className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <CardTitle className="text-2xl">{pack.name}</CardTitle>
                    <CardDescription className="mt-1">{pack.description}</CardDescription>
                </div>
            </div>
        </CardHeader>
      )}

      <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6">
         <div className="flex items-baseline gap-2 text-5xl font-bold text-primary">
            {getIcon()}
            <span>{pack.amount.toLocaleString()}</span>
         </div>
         <p className="text-muted-foreground">{pack.type}</p>
         {!pack.imageUrl && <CardDescription className="mt-2">{pack.description}</CardDescription>}
      </CardContent>
      <CardFooter className="flex-col items-stretch p-4">
        <Button onClick={handleBuy} size="lg" className="w-full text-lg font-bold" disabled={isBuying}>
            {isBuying ? 'Processing...' : `Buy for ${getPriceDisplay()}`}
        </Button>
      </CardFooter>
    </Card>
  );
}
