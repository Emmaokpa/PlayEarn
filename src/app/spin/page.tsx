'use client';

import AppLayout from '@/components/layout/app-layout';
import SpinWheel from '@/components/app/spin-wheel';
import { Button } from '@/components/ui/button';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, runTransaction, serverTimestamp, collection, writeBatch, Timestamp } from 'firebase/firestore';
import type { UserProfile } from '@/lib/data';
import { useState, useEffect } from 'react';
import { Gift, History } from 'lucide-react';
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

// Define prizes directly in the component for now
const prizes = [
  { id: 'prize-50', text: '50', type: 'coins', value: 50, probability: 35 },
  { id: 'prize-100', text: '100', type: 'coins', value: 100, probability: 25 },
  { id: 'prize-sticker-common', text: 'Sticker', type: 'sticker', value: 'common', probability: 15 },
  { id: 'prize-200', text: '200', type: 'coins', value: 200, probability: 12 },
  { id: 'prize-sticker-rare', text: 'Rare Sticker', type: 'sticker', value: 'rare', probability: 6 },
  { id: 'prize-entry-1', text: '$1 Entry', type: 'entry', value: 1, probability: 4 },
  { id: 'prize-500', text: '500', type: 'coins', value: 500, probability: 2.5 },
  { id: 'prize-gift-5', text: '$5', type: 'gift_card', value: 5, probability: 0.4 },
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
  const [result, setResult] = useState<typeof prizes[number] | null>(null);

  const userProfileRef = useMemoFirebase(() =>
    user ? doc(firestore, 'users', user.uid) : null,
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const spinDataRef = useMemoFirebase(() =>
    user ? doc(firestore, `users/${user.uid}/spinData`, 'spin_status') : null,
    [user, firestore]
  );
  const { data: spinData, isLoading: isSpinDataLoading } = useDoc<UserSpinData>(spinDataRef);

  const [spinsAvailable, setSpinsAvailable] = useState(0);

  useEffect(() => {
    if (!spinData || isSpinDataLoading) return;

    const todayStr = new Date().toISOString().split('T')[0];
    if (spinData.lastResetDate !== todayStr) {
      // It's a new day, we need to reset the daily spins.
      // We do this inside the spin transaction to ensure atomicity.
      setSpinsAvailable(1 + (spinData.purchasedSpinsRemaining || 0));
    } else {
      setSpinsAvailable(spinData.freeSpinsRemaining + (spinData.purchasedSpinsRemaining || 0));
    }
  }, [spinData, isSpinDataLoading]);


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
    if (!firestore || !user || isSpinning || spinsAvailable <= 0) return;

    setIsSpinning(true);

    const { prize, index: winningIndex } = getPrize();
    setPrizeIndex(winningIndex);

    try {
      await runTransaction(firestore, async (transaction) => {
        const userSpinDocRef = doc(firestore, `users/${user.uid}/spinData`, 'spin_status');
        const userDocRef = doc(firestore, 'users', user.uid);
        const spinHistoryRef = doc(collection(firestore, `users/${user.uid}/spinHistory`));

        let currentSpinData = await transaction.get(userSpinDocRef);
        let spinDataToWrite: UserSpinData;

        const todayStr = new Date().toISOString().split('T')[0];

        if (!currentSpinData.exists() || currentSpinData.data().lastResetDate !== todayStr) {
          // New day or first spin ever
          spinDataToWrite = {
            id: user.uid,
            freeSpinsRemaining: 0, // Will be 0 after this spin
            adSpinsUsedToday: 0,
            purchasedSpinsRemaining: currentSpinData.exists() ? currentSpinData.data().purchasedSpinsRemaining : 0,
            lastSpinTimestamp: serverTimestamp() as Timestamp,
            lastResetDate: todayStr,
          };
        } else {
          // Same day, just decrementing spins
          const data = currentSpinData.data() as UserSpinData;
          spinDataToWrite = { ...data }; // copy
          if (data.freeSpinsRemaining > 0) {
            spinDataToWrite.freeSpinsRemaining -= 1;
          } else if (data.purchasedSpinsRemaining > 0) {
            spinDataToWrite.purchasedSpinsRemaining -= 1;
          } else {
            throw new Error("No spins available.");
          }
          spinDataToWrite.lastSpinTimestamp = serverTimestamp() as Timestamp;
        }

        // Apply prize
        if (prize.type === 'coins') {
          transaction.update(userDocRef, { coins: (userProfile?.coins ?? 0) + prize.value });
        }
        // Other prize types (stickers, entries) would be handled here

        // Record spin history
        transaction.set(spinHistoryRef, {
          userId: user.uid,
          prizeWon: prize,
          spinType: 'free', // For now, all are free
          timestamp: serverTimestamp(),
        });
        
        // Commit spin data changes
        transaction.set(userSpinDocRef, spinDataToWrite);
      });

      // Show result after transaction is successful and animation is over
      setTimeout(() => {
        setResult(prize);
        setIsSpinning(false);
      }, 8000); // Wait for wheel animation to finish

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

  const isLoading = isProfileLoading || isSpinDataLoading;

  return (
    <AppLayout title="Spin to Win">
      <div className="flex flex-col items-center gap-8 text-center">
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
              disabled={isSpinning || spinsAvailable <= 0}
            >
              {isSpinning ? 'Spinning...' : 'SPIN'}
            </Button>
            <p className="font-bold text-primary">
              {spinsAvailable} {spinsAvailable === 1 ? 'spin' : 'spins'} left
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <Button variant="outline">
            <Gift className="mr-2 h-4 w-4" />
            Prize List
          </Button>
          <Button variant="outline">
            <History className="mr-2 h-4 w-4" />
            My History
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
            <div className="my-4 flex flex-col items-center justify-center space-y-2 rounded-lg bg-secondary p-8 text-secondary-foreground">
              <p className="text-5xl font-bold text-primary">{result?.text}</p>
              <p className="text-lg">{result?.type === 'coins' ? 'Coins' : ''}</p>
            </div>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setResult(null)}>Awesome!</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
