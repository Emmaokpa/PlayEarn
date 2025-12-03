
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
import { useState } from 'react';

interface PurchasePackCardProps {
  pack: InAppPurchase;
}

export default function PurchasePackCard({ pack }: PurchasePackCardProps) {
  const { toast } = useToast();
  const [isBuying, setIsBuying] = useState(false);

  const priceDisplayText = `Buy for $${pack.price.toFixed(2)}`;

  const handleBuy = async () => {
    // All payment logic has been temporarily removed as requested.
    toast({
      variant: 'destructive',
      title: 'Feature Disabled',
      description: 'The payment feature is currently undergoing maintenance.',
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
        <Button onClick={handleBuy} size="lg" className="w-full text-lg font-bold" disabled>
          {priceDisplayText}
        </Button>
      </CardFooter>
    </Card>
  );
}
