
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

  const priceDisplayText = `Buy for $${pack.price.toFixed(2)}`;

  const handleBuy = async () => {
    // Logic is now handled by the external bot server.
    toast({
        title: 'Check Telegram',
        description: 'Please interact with the RewardPlay Telegram bot to make purchases.',
    });
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
        <Button onClick={handleBuy} size="lg" className="w-full text-lg font-bold">
          {priceDisplayText}
        </Button>
      </CardFooter>
    </Card>
  );
}
