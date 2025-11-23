
'use client';

import { use, useState, useEffect } from 'react';
import { notFound, usePathname } from 'next/navigation';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Award, Smartphone, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment } from 'firebase/firestore';
import { useGameById } from '@/lib/games';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';

const PLAY_TIME_SECONDS = 300; // 5 minutes
const REWARD_AMOUNT = 50;

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const { data: game, isLoading } = useGameById(id);
  const [timeRemaining, setTimeRemaining] = useState(PLAY_TIME_SECONDS);
  const [canClaim, setCanClaim] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (canClaim) return; // Stop the timer if reward can be claimed

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanClaim(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [canClaim]);

  const handleClaimReward = async () => {
    if (!firestore || !user || !game || !canClaim || isClaiming) return;

    setIsClaiming(true);

    try {
      const userRef = doc(firestore, 'users', user.uid);
      // This non-blocking update gives the user coins and increments their daily gameplay count
      updateDocumentNonBlocking(userRef, {
        coins: increment(REWARD_AMOUNT),
        gamePlaysToday: increment(1)
      });
      
      toast({
        title: "Reward Claimed!",
        description: `You earned ${REWARD_AMOUNT} coins for playing ${game.name}.`,
      });
      // Disable claim button after claiming
      setCanClaim(false); 
    } catch (e) {
      console.error("Error claiming reward", e);
      toast({
        title: "Error",
        description: "Could not claim your reward.",
        variant: "destructive",
      });
    } finally {
        setIsClaiming(false);
    }
  };

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  if (isLoading) {
    return (
      <AppLayout title="Loading Game...">
        <div className="space-y-4">
          <Skeleton className="aspect-video w-full" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!game) {
    notFound();
  }

  return (
    <AppLayout title={game.name}>
        <div className="h-full w-full flex flex-col space-y-4">
            <Alert className="md:hidden bg-secondary border-secondary-foreground/20 landscape:hidden">
            <Smartphone className="h-4 w-4" />
            <AlertTitle>For a better experience</AlertTitle>
            <AlertDescription>
                Rotate your device to landscape mode.
            </AlertDescription>
            </Alert>

            <Card className="w-full overflow-hidden bg-black shadow-lg flex-1 min-h-0 landscape:fixed landscape:inset-0 landscape:z-[100] landscape:rounded-none landscape:border-0">
            <iframe
                src={game.iframeUrl}
                title={game.name}
                className="h-full w-full border-0"
                allow="fullscreen; gamepad; autoplay;"
                sandbox="allow-scripts allow-same-origin"
            />
            </Card>
            <div className="flex items-center justify-between landscape:hidden">
            <p className="text-sm text-muted-foreground">
                Now playing: {game.name}
            </p>
            <Button onClick={handleClaimReward} size="lg" disabled={!canClaim || isClaiming}>
                {isClaiming ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                <Award className="mr-2 h-4 w-4" />
                )}
                {canClaim
                ? `Claim ${REWARD_AMOUNT} Coins`
                : `Claim in ${minutes}:${seconds.toString().padStart(2, '0')}`}
            </Button>
            </div>
      </div>
    </AppLayout>
  );
}
