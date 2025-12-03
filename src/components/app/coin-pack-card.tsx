
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
import { Coins, Gem } from 'lucide-react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, writeBatch, increment } from 'firebase/firestore';

interface CoinPackCardProps {
  pack: InAppPurchase;
}

export default function CoinPackCard({ pack }: CoinPackCardProps) {
  const { toast } = useToast();
  const { user, firestore } = useFirebase();

  const handleBuy = async () => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You must be logged in to buy coins.',
      });
      return;
    }
    
    // In a real app, this would trigger a payment flow.
    // For this prototype, we'll just add the coins directly.
    try {
        const batch = writeBatch(firestore);
        const userRef = doc(firestore, 'users', user.uid);

        batch.update(userRef, { coins: increment(pack.amount) });
        
        // You might also record the purchase transaction
        // const purchaseRef = doc(collection(firestore, 'purchases'));
        // batch.set(purchaseRef, { ... });

        await batch.commit();

        toast({
            title: 'Purchase Successful!',
            description: `You've added ${pack.amount.toLocaleString()} coins to your balance.`,
        });
    } catch (error) {
        console.error("Coin purchase failed: ", error);
        toast({
            variant: 'destructive',
            title: 'Purchase Failed',
            description: 'Could not complete your purchase. Please try again.',
        });
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg hover:border-primary">
      <CardHeader>
        <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
                <Coins className="h-8 w-8 text-primary" />
            </div>
            <div>
                <CardTitle className="text-2xl">{pack.name}</CardTitle>
                <CardDescription className="mt-1">{pack.description}</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6">
         <div className="flex items-baseline gap-2 text-5xl font-bold text-primary">
            <Gem className="h-10 w-10" />
            <span>{pack.amount.toLocaleString()}</span>
         </div>
      </CardContent>
      <CardFooter className="flex-col items-stretch p-4">
        <Button onClick={handleBuy} size="lg" className="w-full text-lg font-bold">
          Buy for ${pack.price.toFixed(2)}
        </Button>
      </CardFooter>
    </Card>
  );
}
