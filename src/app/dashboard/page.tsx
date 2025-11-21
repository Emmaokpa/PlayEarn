
'use client';

import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import type { Game } from '@/lib/data';
import { getAllGames } from '@/lib/games';
import GameCard from '@/components/app/game-card';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/components/layout/app-layout';
import { useEffect, useState } from 'react';
import DailyBonusDialog from '@/components/app/daily-bonus-dialog';
import { useFirebase } from '@/firebase';
import { doc, increment, writeBatch } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { firestore, user } = useFirebase();
  
  const [games, setGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  useEffect(() => {
    const allGames = getAllGames();
    setGames(allGames);
    setGamesLoading(false);
  }, []);

  const exclusiveGames = games?.slice(0, 2) ?? [];
  const freeGames = games?.slice(2, 4) ?? [];
  const newGames = games?.slice(4) ?? [];

  const [isBonusDialogOpen, setIsBonusDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const lastClaimed = localStorage.getItem(`dailyBonusClaimed_${user.uid}`);
    const today = new Date().toDateString();
    if (lastClaimed !== today) {
      setIsBonusDialogOpen(true);
    }
  }, [user]);

  const handleBonusClaim = async (amount: number) => {
    if (!firestore || !user) return;
    const today = new Date().toDateString();
    localStorage.setItem(`dailyBonusClaimed_${user.uid}`, today);

    const userProfileRef = doc(firestore, 'users', user.uid);
    try {
      const batch = writeBatch(firestore);
      batch.update(userProfileRef, { coins: increment(amount) });
      await batch.commit();
    } catch (error) {
      console.error('Failed to claim bonus:', error);
      localStorage.removeItem(`dailyBonusClaimed_${user.uid}`);
    }

    setIsBonusDialogOpen(false);
  };

  const renderGameCarousel = () => {
    if (gamesLoading || !games) {
      return (
        <Skeleton className="aspect-video w-full overflow-hidden rounded-xl" />
      );
    }
    return (
      <Carousel opts={{ loop: true }}>
        <CarouselContent>
          {games.map((game, index) => (
            <CarouselItem key={game.id}>
              <div className="relative aspect-video w-full overflow-hidden rounded-xl">
                <Image
                  src={game.imageUrl}
                  alt={game.name}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  sizes="100vw"
                  data-ai-hint={game.imageHint}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4 text-white">
                  <h3 className="text-2xl font-bold">{game.name}</h3>
                  <Badge variant="secondary" className="mt-2">
                    {game.category}
                  </Badge>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    );
  };

  const renderGameSection = (title: string, gamesList: Game[], isLoading: boolean) => (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Link href="/games">
          <Button variant="link" className="text-primary">
            See All
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))
          : gamesList.map((game) => <GameCard key={game.id} game={game} />)}
      </div>
    </div>
  );


  return (
    <AppLayout title="Explore">
      <div className="space-y-8">
        {renderGameCarousel()}
        {renderGameSection('Exclusive Games', exclusiveGames, gamesLoading)}
        {renderGameSection('Try for free', freeGames, gamesLoading)}
        {renderGameSection('New Releases', newGames, gamesLoading)}
      </div>
       <DailyBonusDialog
        open={isBonusDialogOpen}
        onOpenChange={setIsBonusDialogOpen}
        onClaim={handleBonusClaim}
      />
    </AppLayout>
  );
}
