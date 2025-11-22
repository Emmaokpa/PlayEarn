
'use client';

import { useState } from 'react';
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
import { Coins, Crown, Gamepad2, Play, Trophy, Video } from 'lucide-react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/data';
import { doc } from 'firebase/firestore';
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
  progress: number;
  target: number;
}

const allChallenges: Challenge[] = [
  {
    id: 'daily-login',
    title: 'Daily Check-in',
    description: 'Log in to the app.',
    reward: 50,
    icon: Play,
    difficulty: 'Easy',
    isVipOnly: false,
    progress: 1,
    target: 1,
  },
  {
    id: 'watch-3-ads',
    title: 'Ad Marathon',
    description: 'Watch 3 video ads.',
    reward: 200,
    icon: Video,
    difficulty: 'Easy',
    isVipOnly: false,
    progress: 1,
    target: 3,
  },
  {
    id: 'play-5-games',
    title: 'Game Explorer',
    description: 'Play 5 different games.',
    reward: 500,
    icon: Gamepad2,
    difficulty: 'Moderate',
    isVipOnly: false,
    progress: 3,
    target: 5,
  },
  {
    id: 'win-1000-coins',
    title: 'Coin Collector',
    description: 'Win a total of 1,000 coins from spins or games.',
    reward: 750,
    icon: Coins,
    difficulty: 'Moderate',
    isVipOnly: false,
    progress: 450,
    target: 1000,
  },
  {
    id: 'vip-play-10-games',
    title: 'VIP Game Master',
    description: 'Play 10 different games.',
    reward: 2500,
    icon: Trophy,
    difficulty: 'Hard',
    isVipOnly: true,
    progress: 4,
    target: 10,
  },
  {
    id: 'vip-win-jackpot',
    title: 'Jackpot Hunter',
    description: 'Win a prize of Epic rarity or higher from the Spin Wheel.',
    reward: 5000,
    icon: Crown,
    difficulty: 'Hard',
    isVipOnly: true,
    progress: 0,
    target: 1,
  },
];

function ChallengeCard({ challenge, isVip }: { challenge: Challenge, isVip: boolean }) {
  const { toast } = useToast();
  const [isClaimed, setIsClaimed] = useState(false);
  
  const isCompleted = challenge.progress >= challenge.target;
  const canClaim = isCompleted && !isClaimed;
  const isLocked = challenge.isVipOnly && !isVip;
  const progressPercent = (challenge.progress / challenge.target) * 100;
  
  const handleClaim = () => {
     // In a real app, this would be a Firestore transaction
     setIsClaimed(true);
     toast({
        title: "Reward Claimed!",
        description: `You earned ${challenge.reward} coins for completing "${challenge.title}".`
     })
  }

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
            <span>{challenge.progress.toLocaleString()} / {challenge.target.toLocaleString()}</span>
            <span>{challenge.difficulty}</span>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-stretch">
        {isLocked ? (
             <Button disabled variant="outline" size="sm">Upgrade to VIP to Unlock</Button>
        ) : (
            <Button onClick={handleClaim} disabled={!canClaim} size="sm">
            {isClaimed ? 'Claimed' : (isCompleted ? 'Claim Reward' : 'In Progress')}
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
  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, 'users', user.uid) : null, 
    [user, firestore]
  );
  const { data: userProfile, isLoading } = useDoc<UserProfile>(userProfileRef);

  const isVip = userProfile?.isVip ?? false;
  
  if (isLoading) {
    return (
        <AppLayout title="Daily Challenges">
            <div className="mb-8 text-center">
                <Skeleton className="h-9 w-64 mx-auto" />
                <Skeleton className="h-5 w-80 mx-auto mt-2" />
            </div>
             <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-60" />)}
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
          <ChallengeCard key={challenge.id} challenge={challenge} isVip={isVip} />
        ))}
      </div>
    </AppLayout>
  );
}
