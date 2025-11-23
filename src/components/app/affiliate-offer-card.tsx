
'use client';

import type { AffiliateOffer } from '@/lib/data';
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
import { Coins, CheckCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment, writeBatch, serverTimestamp, collection, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import Link from 'next/link';

interface AffiliateOfferCardProps {
  offer: AffiliateOffer;
  userCoins: number;
  isCompleted: boolean;
}

export default function AffiliateOfferCard({
  offer,
  userCoins,
  isCompleted: initialIsCompleted,
}: AffiliateOfferCardProps) {
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted);

  // This function would be called via a webhook or manual confirmation in a real app
  // For this demo, we'll call it optimistically when the user clicks the link.
  const handleCompleteOffer = async () => {
    if (!user || !firestore || isCompleted) return;

    try {
      const batch = writeBatch(firestore);

      // 1. Give the user their reward
      const userRef = doc(firestore, 'users', user.uid);
      batch.update(userRef, { coins: increment(offer.rewardCoins) });

      // 2. Mark the offer as completed for this user
      const completedOfferRef = doc(firestore, `users/${user.uid}/affiliateSignups`, offer.id);
      batch.set(completedOfferRef, {
          id: completedOfferRef.id,
          userId: user.uid,
          offerId: offer.id,
          completedAt: serverTimestamp(),
      });
      
      await batch.commit();

      setIsCompleted(true);
      toast({
        title: 'Offer Completed!',
        description: `You've earned ${offer.rewardCoins.toLocaleString()} coins for completing the "${offer.title}" offer.`,
      });

    } catch (error) {
       console.error("Error completing offer:", error);
       toast({
           variant: 'destructive',
           title: 'Error',
           description: 'There was an issue recording your offer completion. Please contact support.',
       })
    }

  };

  return (
    <Card
      className={cn(
        'flex flex-col overflow-hidden transition-shadow hover:shadow-lg',
        isCompleted && 'opacity-70'
      )}
    >
      <CardHeader className="p-0">
        <div className="relative aspect-video">
          <Image
            src={offer.imageUrl}
            alt={offer.title}
            fill
            className="rounded-t-lg object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            data-ai-hint={offer.imageHint}
            referrerPolicy="no-referrer"
            unoptimized
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <CardTitle>{offer.title}</CardTitle>
        <CardDescription className="mt-2 text-sm">{offer.description}</CardDescription>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4 rounded-b-lg bg-secondary/50 p-4">
        <div className="flex w-full items-center justify-between">
           <p className="text-sm font-semibold text-muted-foreground">REWARD</p>
            <div className="flex items-center gap-2 text-xl font-bold text-primary">
                <Coins className="h-6 w-6" />
                <span>{offer.rewardCoins.toLocaleString()}</span>
            </div>
        </div>
         <Button asChild size="lg" className="w-full" disabled={isCompleted}>
            <Link href={offer.link} target="_blank" rel="noopener noreferrer" onClick={handleCompleteOffer}>
                {isCompleted ? (
                    <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Offer Completed
                    </>
                ) : (
                     <>
                        Start Offer
                        <ExternalLink className="ml-2 h-5 w-5" />
                    </>
                )}
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
