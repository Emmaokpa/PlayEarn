
'use client';

import type { CoinPack } from '@/lib/data';
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
import { Coins, CheckCircle, Gem } from 'lucide-react';
import { useFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment } from 'firebase/firestore';

interface CoinPackCardProps {
  pack: CoinPack;
}

export default function CoinPackCard({ pack }: CoinPackCardProps) {
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const handleBuy = () => {
    if (!user || !firestore) return;
    
    // In a real app, this would trigger a payment flow (Stripe, Paddle, etc.)
    // For now, we'll just simulate the purchase and add the coins.
    
    const userRef = doc(firestore, 'users', user.uid);
    updateDocumentNonBlocking(userRef, { coins: increment(pack.coins) });
    
    toast({
      title: 'Purchase Successful!',
      description: `You've successfully purchased the "${pack.name}" and received ${pack.coins.toLocaleString()} coins.`,
    });
  };

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg hover:border-primary">
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
      <CardContent className="flex-1 flex flex-col items-center justify-center text-center">
         <div className="flex items-baseline gap-2 text-5xl font-bold text-primary">
            <Coins className="h-10 w-10" />
            <span>{pack.coins.toLocaleString()}</span>
         </div>
         <p className="text-muted-foreground">coins</p>
      </CardContent>
      <CardFooter className="flex-col items-stretch p-4">
        <Button onClick={handleBuy} size="lg" className="w-full text-lg font-bold">
            Buy for ${pack.price.toFixed(2)}
        </Button>
      </CardFooter>
    </Card>
  );
}

    