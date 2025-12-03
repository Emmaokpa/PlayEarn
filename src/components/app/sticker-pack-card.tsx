
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
import { CheckCircle, Star, Coins, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useFirebase } from '@/firebase';

interface StickerPackCardProps {
  pack: StickerPack;
  userCoins: number;
}

export default function StickerPackCard({ pack, userCoins }: StickerPackCardProps) {
  const { toast } = useToast();
  const { user } = useFirebase();
  const [isBuying, setIsBuying] = useState(false);

  const priceDisplayText = pack.price.toLocaleString();

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
                purchaseType: 'stickerPacks',
                userId: user.uid,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to create invoice.');
        }

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
        <Button onClick={handleBuy} disabled={isBuying} size="sm">
          {isBuying ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Star className="h-4 w-4 mr-1" />Buy</>}
        </Button>
      </CardFooter>
    </Card>
  );
}
