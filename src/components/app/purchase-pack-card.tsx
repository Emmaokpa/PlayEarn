
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
import { doc, increment, writeBatch } from 'firebase/firestore';
import Image from 'next/image';

interface PurchasePackCardProps {
  pack: InAppPurchase;
}

export default function PurchasePackCard({ pack }: PurchasePackCardProps) {
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const handleBuy = async () => {
    if (!user || !firestore) return;
    
    // In a real app, this would trigger a payment flow (Stripe, Paddle, etc.)
    // For now, we'll just simulate the purchase and add the items.
    
    try {
        const batch = writeBatch(firestore);

        if (pack.type === 'coins') {
            const userRef = doc(firestore, 'users', user.uid);
            batch.update(userRef, { coins: increment(pack.amount) });
        } else if (pack.type === 'spins') {
            const spinDataRef = doc(firestore, `users/${user.uid}/spinData`, 'spin_status');
            batch.set(spinDataRef, { purchasedSpinsRemaining: increment(pack.amount) }, { merge: true });
        }

        await batch.commit();

        toast({
        title: 'Purchase Successful!',
        description: `You've successfully purchased the "${pack.name}" and received ${pack.amount.toLocaleString()} ${pack.type}.`,
        });

    } catch (error) {
        console.error("Purchase failed:", error);
        toast({
            variant: 'destructive',
            title: 'Purchase Failed',
            description: 'Something went wrong. Please try again.',
        });
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
       {pack.imageUrl ? (
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
        <Button onClick={handleBuy} size="lg" className="w-full text-lg font-bold">
            Buy for ${pack.price.toFixed(2)}
        </Button>
      </CardFooter>
    </Card>
  );
}
