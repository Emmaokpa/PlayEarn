
'use client';

import { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/components/layout/app-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Coins, Crown, Gamepad2, Play, Trophy, Video, Star } from 'lucide-react';
import { useFirebase, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import type { UserProfile, AdView, SpinHistory } from '@/lib/data';
import { doc, collection, query, where, writeBatch, increment, getDoc, setDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  icon: React.ElementType;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  isVipOnly: boolean;
  target: number;
  getProgress: (data: ChallengeData) => number;
}

interface ChallengeData {
  adViewsToday: AdView[];
  spinsToday: SpinHistory[];
  gamePlaysToday: number;
}

const allChallenges: Challenge[] = [
  {
    id: 'first-spin-of-day',
    title: 'First Spin',
    description: 'Use your first spin of the day.',
    reward: 5,
    icon: Star,
    difficulty: 'Easy',
    isVipOnly: false,
    target: 1,
    getProgress: (data) => data.spinsToday.length > 0 ? 1 : 0,
  },
  {
    id: 'watch-3-ads',
    title: 'Ad Marathon',
    description: 'Watch 3 video ads.',
    reward: 20,
    icon: Video,
    difficulty: 'Easy',
    isVipOnly: false,
    target: 3,
    getProgress: (data) => data.adViewsToday.length,
  },
  {
    id: 'play-10-games',
    title: 'Game Starter',
    description: 'Play 10 game sessions.',
    reward: 10,
    icon: Gamepad2,
    difficulty: 'Easy',
    isVipOnly: false,
    target: 10,
    getProgress: (data) => data.gamePlaysToday,
  },
  {
    id: 'spin-5-times',
    title: 'Spin Master',
    description: 'Spin the wheel 5 times.',
    reward: 30,
    icon: Gamepad2,
    difficulty: 'Moderate',
    isVipOnly: false,
    target: 5,
    getProgress: (data) => data.spinsToday.length,
  },
  {
    id: 'play-30-games',
    title: 'Game Enthusiast',
    description: 'Play 30 game sessions.',
    reward: 20,
    icon: Gamepad2,
    difficulty: 'Moderate',
    isVipOnly: false,
    target: 30,
    getProgress: (data) => data.gamePlaysToday,
  },
  {
    id: 'win-100-coins',
    title: 'Coin Collector',
    description: 'Win a total of 100 coins from spins.',
    reward: 75,
    icon: Coins,
    difficulty: 'Moderate',
    isVipOnly: false,
    target: 100,
    getProgress: (data) => data.spinsToday
        .filter(s => s.prizeWon.type === 'coins')
        .reduce((sum, s) => sum + (s.prizeWon.value as number), 0),
  },
  {
    id: 'play-50-games',
    title: 'Game Legend',
    description: 'Play 50 game sessions in one day.',
    reward: 30,
    icon: Trophy,
    difficulty: 'Hard',
    isVipOnly: false,
    target: 50,
    getProgress: (data) => data.gamePlaysToday,
  },
  {
    id: 'vip-spin-10-times',
    title: 'VIP Spinner',
    description: 'Spin the wheel 10 times.',
    reward: 250,
    icon: Trophy,
    difficulty: 'Hard',
    isVipOnly: true,
    target: 10,
    getProgress: (data) => data.spinsToday.length,
  },
  {
    id: 'vip-win-jackpot',
    title: 'Jackpot Hunter',
    description: 'Win a prize of Epic rarity or higher from the Spin Wheel.',
    reward: 500,
    icon: Crown,
    difficulty: 'Hard',
    isVipOnly: true,
    target: 1,
    getProgress: (data) => data.spinsToday.filter(s => (s.prizeWon.probability < 5)).length,
  },
];

function ChallengeCard({
  challenge,
  isVip,
  progress,
  isClaimed,
  onClaim,
  isClaiming,
}: {
  challenge: Challenge;
  isVip: boolean;
  progress: number;
  isClaimed: boolean;
  onClaim: (challengeId: string, reward: number) => void;
  isClaiming: boolean;
}) {
  const isCompleted = progress >= challenge.target;
  const canClaim = isCompleted && !isClaimed;
  const isLocked = challenge.isVipOnly && !isVip;
  const progressPercent = Math.min((progress / challenge.target) * 100, 100);

  return (
    <Card className={cn("flex flex-col", isLocked && "bg-secondary/30 opacity-60")}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
                <challenge.icon className="h-8 w-8 text-accent" />
                <div>
                    <CardTitle className="text-lg">{challenge.title}</CardTitle>
                    <CardDescription className="text-sm mt-1">{challenge.description}</CardDescription>
                </div>
            </div>
            {challenge.isVipOnly && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Crown className="h-4 w-4" />
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        <Progress value={progressPercent} className="h-3" />
        <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.min(progress, challenge.target).toLocaleString()} / {challenge.target.toLocaleString()}</span>
            <span>{challenge.difficulty}</span>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-stretch">
        {isLocked ? (
             <Button disabled variant="outline" size="sm">Upgrade to VIP to Unlock</Button>
        ) : (
            <Button onClick={() => onClaim(challenge.id, challenge.reward)} disabled={!canClaim || isClaiming} size="sm">
            {isClaimed ? 'Claimed' : (isCompleted ? (isClaiming ? 'Claiming...' : 'Claim Reward') : 'In Progress')}
            </Button>
        )}
         <div className="mt-2 flex items-center justify-center gap-1 text-sm font-bold text-primary">
            <Coins className="h-4 w-4" />
            <span>{challenge.reward.toLocaleString()}</span>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function ChallengesPage() {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const [claimedChallenges, setClaimedChallenges] = useState<string[]>([]);
  const [isClaiming, setIsClaiming] = useState(false);

  // Memoize start of today
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'users', user.uid) : null, 
    [user, firestore]
  );
  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);
  
  const dailyChallengeStateRef = useMemoFirebase(() =>
    user ? doc(firestore, `users/${user.uid}/dailyChallenges`, todayStr) : null,
    [user, firestore, todayStr]
  );

  useEffect(() => {
    if (!dailyChallengeStateRef || !user || !firestore) return;
    const fetchClaimedStatus = async () => {
        const docSnap = await getDoc(dailyChallengeStateRef);
        if (docSnap.exists()) {
            setClaimedChallenges(docSnap.data().claimed ?? []);
        } else {
            // New day, reset claimed challenges and gameplays
            setClaimedChallenges([]);
            if (user) {
                // Check if user's last gameplay reset was not today
                const userDocSnap = await getDoc(doc(firestore, `users/${user.uid}`));
                if (userDocSnap.exists() && userDocSnap.data().lastGameplayReset !== todayStr) {
                    await setDoc(doc(firestore, `users/${user.uid}`), { gamePlaysToday: 0, lastGameplayReset: todayStr }, { merge: true });
                }
            }
        }
    };
    fetchClaimedStatus();
  }, [dailyChallengeStateRef, todayStr, user, firestore]);


  const adViewsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, `users/${user.uid}/adViews`), where('timestamp', '>=', today)) : null,
    [user, firestore, today]
  );
  const { data: adViewsToday, isLoading: adViewsLoading } = useCollection<AdView>(adViewsQuery);

  const spinsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, `users/${user.uid}/spinHistory`), where('timestamp', '>=', today)) : null,
    [user, firestore, today]
  );
  const { data: spinsToday, isLoading: spinsLoading } = useCollection<SpinHistory>(spinsQuery);
  
  const isLoading = profileLoading || adViewsLoading || spinsLoading;
  const isVip = userProfile?.isVip ?? false;

  const challengeData: ChallengeData = {
    adViewsToday: adViewsToday ?? [],
    spinsToday: spinsToday ?? [],
    gamePlaysToday: userProfile?.gamePlaysToday ?? 0,
  };

  const handleClaimReward = async (challengeId: string, reward: number) => {
    if (!user || !firestore || isClaiming) return;
    setIsClaiming(true);
    
    try {
        const batch = writeBatch(firestore);
        
        const userRef = doc(firestore, 'users', user.uid);
        batch.update(userRef, { coins: increment(reward) });
        
        if (!dailyChallengeStateRef) throw new Error("Daily challenge state ref not found");
        const newClaimed = [...claimedChallenges, challengeId];
        batch.set(dailyChallengeStateRef, { claimed: newClaimed }, { merge: true });

        await batch.commit();

        setClaimedChallenges(newClaimed);
        toast({
            title: "Reward Claimed!",
            description: `You earned ${reward} coins.`,
        });
    } catch (error) {
        console.error("Error claiming challenge reward:", error);
        toast({
            variant: 'destructive',
            title: "Claim Failed",
            description: "Could not claim your reward. Please try again.",
        });
    } finally {
        setIsClaiming(false);
    }
  }

  if (isLoading) {
    return (
        <AppLayout title="Daily Challenges">
            <div className="mb-8 text-center">
                <Skeleton className="h-9 w-64 mx-auto" />
                <Skeleton className="h-5 w-80 mx-auto mt-2" />
            </div>
             <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-60" />)}
            </div>
        </AppLayout>
    )
  }

  return (
    <AppLayout title="Daily Challenges">
      <div className="mb-8 text-center">
        <h2 className="font-headline text-3xl font-bold">Daily Challenges</h2>
        <p className="mt-2 text-muted-foreground">
          Complete tasks to earn bonus coins. New challenges every day!
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allChallenges.map((challenge) => (
          <ChallengeCard 
            key={challenge.id} 
            challenge={challenge} 
            isVip={isVip} 
            progress={challenge.getProgress(challengeData)}
            isClaimed={claimedChallenges.includes(challenge.id)}
            onClaim={handleClaimReward}
            isClaiming={isClaiming}
            />
        ))}
      </div>
    </AppLayout>
  );
}
