
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
import { Coins, CheckCircle } from 'lucide-react';
import { useFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment } from 'firebase/firestore';
import { useState } from 'react';

interface StickerPackCardProps {
  pack: StickerPack;
  userCoins: number;
}

export default function StickerPackCard({ pack, userCoins }: StickerPackCardProps) {
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [isBought, setIsBought] = useState(false); // In a real app, check against user's purchased packs

  const canAfford = userCoins >= pack.price;
  const canBuy = canAfford && !isBought;

  const handleBuy = () => {
    if (!user || !firestore) return;

    if (!canAfford) {
      toast({
        variant: 'destructive',
        title: 'Not enough coins!',
        description: `You need ${
          pack.price - userCoins
        } more coins to buy this.`,
      });
      return;
    }
    
    const userRef = doc(firestore, 'users', user.uid);
    updateDocumentNonBlocking(userRef, { coins: increment(-pack.price) });

    // Here you would typically also create a record of the purchase
    // For example, in a `/users/{userId}/purchasedStickers` subcollection
    setIsBought(true);
    
    toast({
      title: 'Stickers Purchased!',
      description: `You've successfully bought the "${pack.name}" pack.`,
    });
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
          <span>{pack.price.toLocaleString()}</span>
        </div>
        <Button onClick={handleBuy} disabled={!canBuy} size="sm" className={isBought ? "bg-green-600 hover:bg-green-600" : ""}>
          {isBought ? <CheckCircle className="mr-2" /> : null}
          {isBought ? 'Owned' : 'Buy'}
        </Button>
      </CardFooter>
    </Card>
  );
}
