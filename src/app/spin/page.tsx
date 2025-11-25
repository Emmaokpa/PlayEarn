'use client';

import AppLayout from '@/components/layout/app-layout';
import SpinWheel from '@/components/app/spin-wheel';
import { Button } from '@/components/ui/button';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, runTransaction, serverTimestamp, collection, Timestamp, increment, addDoc, writeBatch } from 'firebase/firestore';
import type { UserProfile, SpinPrize } from '@/lib/data';
import { useState, useEffect } from 'react';
import { Gift, History, Loader2, Video, ShoppingCart, Star, Coins } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import WatchAdDialog from '@/components/app/watch-ad-dialog';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import PrizeListDialog from '@/components/app/prize-list-dialog';
import Confetti from 'react-confetti';
import { useWindowSize } from '@react-hook/window-size';


const AD_SPIN_LIMIT = 3;

// Define prizes directly in the component, now with a proper Jackpot
const prizes: SpinPrize[] = [
  { id: 'prize-50', text: '50', type: 'coins', value: 50, probability: 35 },
  { id: 'prize-100', text: '100', type: 'coins', value: 100, probability: 25 },
  { id: 'prize-sticker-common', text: 'Sticker', type: 'sticker', value: 'common', probability: 15 },
  { id: 'prize-200', text: '200', type: 'coins', value: 200, probability: 12 },
  { id: 'prize-sticker-rare', text: 'Rare Sticker', type: 'sticker', value: 'rare', probability: 6 },
  { id: 'prize-entry-1', text: '$1 Entry', type: 'entry', value: 1, probability: 4 },
  { id: 'prize-500', text: '500', type: 'coins', value: 500, probability: 2.5 },
  { id: 'prize-gift-5', text: '$5 Card', type: 'gift_card', value: 5, probability: 0.4 },
  { id: 'prize-jackpot', text: 'JACKPOT', type: 'gift_card', value: 25, probability: 0.1 },
];


// UserSpinData definition from your plan
interface UserSpinData {
  id: string;
  freeSpinsRemaining: number;
  adSpinsUsedToday: number;
  purchasedSpinsRemaining: number;
  lastSpinTimestamp: Timestamp | null;
  lastResetDate: string;
}

export default function SpinPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [isSpinning, setIsSpinning] = useState(false);
  const [prizeIndex, setPrizeIndex] = useState<number | null>(null);
  const [result, setResult] = useState<SpinPrize | null>(null);
  const [isAdDialogOpen, setIsAdDialogOpen] = useState(false);
  const [isPrizeListOpen, setIsPrizeListOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  const userProfileRef = useMemoFirebase(() =>
    user ? doc(firestore, 'users', user.uid) : null,
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const spinDataRef = useMemoFirebase(() =>
    user ? doc(firestore, `users/${user.uid}/spinData`, 'spin_status') : null,
    [user, firestore]
  );
  const { data: spinData, isLoading: isSpinDataLoading } = useDoc<UserSpinData>(spinDataRef, {
    // Ensure we have a default state on first load if the document doesn't exist
    initialData: {
      id: user?.uid,
      freeSpinsRemaining: 0,
      adSpinsUsedToday: 0,
      purchasedSpinsRemaining: 0,
      lastSpinTimestamp: null,
      lastResetDate: '',
    },
  });

  useEffect(() => {
    if (result) {
        setShowConfetti(true);
        const timer = setTimeout(() => setShowConfetti(false), 8000); // Confetti for 8 seconds
        return () => clearTimeout(timer);
    }
  }, [result]);

  // Derived state for available spins
  const totalSpins = (spinData?.freeSpinsRemaining ?? 0) + (spinData?.purchasedSpinsRemaining ?? 0);
  const canWatchAd = (spinData?.adSpinsUsedToday ?? 0) < AD_SPIN_LIMIT;

  const getPrize = () => {
    const random = Math.random() * 100;
    let cumulative = 0;
    for (let i = 0; i < prizes.length; i++) {
      cumulative += prizes[i].probability;
      if (random < cumulative) {
        return { prize: prizes[i], index: i };
      }
    }
    // Fallback to the first prize
    return { prize: prizes[0], index: 0 };
  };

  const handleSpin = async () => {
    if (!firestore || !user || isSpinning || totalSpins <= 0) return;

    setIsSpinning(true);

    const { prize, index: winningIndex } = getPrize();
    setPrizeIndex(winningIndex);

    try {
      await runTransaction(firestore, async (transaction) => {
        const userSpinDocRef = doc(firestore, `users/${user.uid}/spinData`, 'spin_status');
        const userSpinDoc = await transaction.get(userSpinDocRef);
        
        const todayStr = new Date().toISOString().split('T')[0];
        let spinDataToWrite: UserSpinData;
        let usedSpinType: 'free' | 'purchased';

        if (!userSpinDoc.exists() || userSpinDoc.data().lastResetDate !== todayStr) {
          // New day or first spin ever: Reset daily counters, grant 1 free spin
          spinDataToWrite = {
            id: user.uid,
            freeSpinsRemaining: 1, // Start with 1 free spin
            adSpinsUsedToday: 0,
            purchasedSpinsRemaining: userSpinDoc.exists() ? userSpinDoc.data().purchasedSpinsRemaining : 0,
            lastSpinTimestamp: serverTimestamp() as Timestamp,
            lastResetDate: todayStr,
          };
        } else {
          spinDataToWrite = userSpinDoc.data() as UserSpinData;
        }

        // Determine which spin to use and decrement
        if (spinDataToWrite.freeSpinsRemaining > 0) {
          spinDataToWrite.freeSpinsRemaining -= 1;
          usedSpinType = 'free';
        } else if (spinDataToWrite.purchasedSpinsRemaining > 0) {
          spinDataToWrite.purchasedSpinsRemaining -= 1;
          usedSpinType = 'purchased';
        } else {
          throw new Error("No spins available.");
        }
        
        spinDataToWrite.lastSpinTimestamp = serverTimestamp() as Timestamp;

        // Apply prize based on type
        if (prize.type === 'coins') {
          const userDocRef = doc(firestore, 'users', user.uid);
          transaction.update(userDocRef, { coins: increment(prize.value as number) });
        } else {
          // For all non-coin prizes, add them to the user's prize collection
          const newPrizeRef = doc(collection(firestore, `users/${user.uid}/prizes`));
          transaction.set(newPrizeRef, {
            userId: user.uid,
            prize: prize,
            status: 'unclaimed',
            wonAt: serverTimestamp(),
            id: newPrizeRef.id,
          });
        }


        // Record spin history
        const spinHistoryRef = doc(collection(firestore, `users/${user.uid}/spinHistory`));
        transaction.set(spinHistoryRef, {
          userId: user.uid,
          prizeWon: prize,
          spinType: usedSpinType,
          timestamp: serverTimestamp(),
          id: spinHistoryRef.id
        });
        
        // Commit spin data changes
        transaction.set(userSpinDocRef, spinDataToWrite, { merge: true });
      });

      // Show result after transaction is successful and animation is over
      setTimeout(() => {
        setResult(prize);
        setIsSpinning(false);
      }, 5000); // Wait for wheel animation to finish

    } catch (error) {
      console.error("Spin transaction failed: ", error);
      toast({
        variant: "destructive",
        title: "Spin Failed",
        description: "Something went wrong. Please try again.",
      });
      setIsSpinning(false);
      setPrizeIndex(null);
    }
  };
  
  const handleAdComplete = async () => {
    if (!firestore || !user) return;
    
    const batch = writeBatch(firestore);
    
    // Grant a spin
    const spinDataRef = doc(firestore, `users/${user.uid}/spinData`, 'spin_status');
    batch.set(spinDataRef, { 
        purchasedSpinsRemaining: increment(1),
        adSpinsUsedToday: increment(1),
    }, { merge: true });

    // Record the ad view for challenges
    const adViewRef = doc(collection(firestore, `users/${user.uid}/adViews`));
    batch.set(adViewRef, {
      userId: user.uid,
      adId: 'spin-for-prize',
      timestamp: serverTimestamp(),
    });

    try {
        await batch.commit();
        toast({
            title: "Spin Awarded!",
            description: "You've earned an extra spin. Good luck!",
        });
    } catch (error) {
        console.error("Failed to grant ad spin:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not grant your spin. Please try again.",
        });
    }
  }

  const renderPrizeContent = () => {
    if (!result) return null;

    let icon, title, description;
    switch(result.type) {
      case 'coins':
        icon = <Coins className="h-16 w-16 text-primary" />;
        title = `${(result.value as number).toLocaleString()} Coins`;
        description = "Added to your balance!";
        break;
      case 'sticker':
        icon = <Star className="h-16 w-16 text-accent" />;
        title = `A ${result.value} Sticker!`;
        description = "Added to your collection.";
        break;

      case 'entry':
        icon = <Gift className="h-16 w-16 text-primary" />;
        title = `$${result.value} Gift Card Entry`;
        description = "You're in the draw! Good luck.";
        break;
      case 'gift_card':
         icon = <Gift className="h-16 w-16 text-yellow-400" />;
         title = result.text === 'JACKPOT' ? "JACKPOT!" : `$${result.value} Gift Card!`;
         description = "Congratulations on the big win!";
         break;
       default:
        return null;
    }
    
    return (
        <div className="my-4 flex flex-col items-center justify-center space-y-2 rounded-lg bg-secondary p-8 text-secondary-foreground">
            {icon}
            <p className={cn("text-4xl font-bold", result.text === 'JACKPOT' ? 'text-yellow-400' : 'text-primary')}>{title}</p>
            <p className="text-lg">{description}</p>
        </div>
    )
  }


  const isLoading = isProfileLoading || isSpinDataLoading;

  return (
    <AppLayout title="Spin to Win">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
      <div className="flex flex-col items-center gap-6 text-center">
        <div>
          <h2 className="font-headline text-3xl font-bold">Daily Spin Wheel</h2>
          <p className="mt-2 text-muted-foreground">
            Spin the wheel for a chance to win amazing prizes!
          </p>
        </div>

        <SpinWheel prizes={prizes} prizeIndex={prizeIndex} isSpinning={isSpinning} />

        {isLoading ? (
          <div className="space-y-4 w-full max-w-sm">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-6 w-3/4 mx-auto" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Button
              size="lg"
              className="px-12 py-8 text-2xl font-bold"
              onClick={handleSpin}
              disabled={isSpinning || totalSpins <= 0}
            >
              {isSpinning ? <Loader2 className="animate-spin h-8 w-8" /> : 'SPIN'}
            </Button>
            <p className="font-bold text-primary">
              {totalSpins} {totalSpins === 1 ? 'spin' : 'spins'} left
            </p>
          </div>
        )}

        <div className="w-full max-w-sm space-y-3 rounded-lg border bg-card p-4 text-card-foreground">
            <h3 className="font-semibold text-center">Get More Spins!</h3>
            <Button variant="outline" className="w-full" disabled={isSpinning || !canWatchAd} onClick={() => setIsAdDialogOpen(true)}>
                <Video className="mr-2 h-4 w-4" />
                Watch Ad for a Spin ({AD_SPIN_LIMIT - (spinData?.adSpinsUsedToday ?? 0)} left)
            </Button>
            <Button asChild variant="outline" className="w-full" disabled={isSpinning}>
                <Link href="/store">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Buy Spin Packs in Store
                </Link>
            </Button>
        </div>

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setIsPrizeListOpen(true)}>
            <Gift className="mr-2 h-4 w-4" />
            Prize List
          </Button>
           <Button asChild variant="outline">
             <Link href="/spin/history">
              <History className="mr-2 h-4 w-4" />
              My History
             </Link>
          </Button>
        </div>

        <AlertDialog open={!!result} onOpenChange={() => setResult(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-center text-2xl">Congratulations!</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                You've won:
              </AlertDialogDescription>
            </AlertDialogHeader>
            {renderPrizeContent()}
            <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
                <Button asChild>
                    <Link href="/store">
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Buy More Spins!
                    </Link>
                </Button>
                <AlertDialogAction onClick={() => setResult(null)} variant="outline">Awesome!</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <WatchAdDialog
            open={isAdDialogOpen}
            onOpenChange={setIsAdDialogOpen}
            onAdComplete={handleAdComplete}
        />

        <PrizeListDialog
            open={isPrizeListOpen}
            onOpenChange={setIsPrizeListOpen}
            prizes={prizes}
        />
      </div>
    </AppLayout>
  );
}

    