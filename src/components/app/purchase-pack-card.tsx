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
import { Coins, Gem, Loader2, Star } from 'lucide-react';
import { useFirebase } from '@/firebase';
import Image from 'next/image';
import { useState } from 'react';

interface PurchasePackCardProps {
  pack: InAppPurchase;
}

export default function PurchasePackCard({ pack }: PurchasePackCardProps) {
  const { toast } = useToast();
  const { user } = useFirebase();
  const [isBuying, setIsBuying] = useState(false);

  const priceDisplayText = `Buy for $${pack.price.toFixed(2)}`;

  const handleBuy = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to make a purchase.'});
        return;
    }
    setIsBuying(true);

    try {
        const response = await fetch('/api/telegram-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productId: pack.id,
                purchaseType: 'inAppPurchases',
                userId: user.uid,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to create invoice.');
        }

        // Redirect user to the Telegram invoice URL
        window.open(result.invoiceUrl, '_blank');
        toast({ title: 'Complete Your Purchase', description: 'Please follow the instructions in Telegram to complete your purchase.' });

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Purchase Failed',
            description: error.message || 'An unknown error occurred.',
        });
    } finally {
        setIsBuying(false);
    }
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

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg hover:border-primary">
       <CardHeader className="p-0">
         <div className="relative aspect-video">
           <Image
            src={pack.imageUrl}
            alt={pack.name}
            fill
            className="rounded-t-lg object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            data-ai-hint={pack.imageHint}
            referrerPolicy="no-referrer"
            unoptimized
          />
         </div>
       </CardHeader>
      
      <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6">
         <div className="flex items-baseline gap-2 text-5xl font-bold text-primary">
            {getIcon()}
            <span>{pack.amount.toLocaleString()}</span>
         </div>
         <p className="text-muted-foreground capitalize">{pack.type}</p>
         <CardDescription className="mt-2">{pack.description}</CardDescription>
      </CardContent>
      <CardFooter className="flex-col items-stretch p-4">
        <Button onClick={handleBuy} size="lg" className="w-full text-lg font-bold" disabled={isBuying}>
          {isBuying ? <Loader2 className="h-6 w-6 animate-spin" /> : priceDisplayText}
        </Button>
      </CardFooter>
    </Card>
  );
}
