
'use client';

import AppLayout from '@/components/layout/app-layout';
import type { Game } from '@/lib/data';
import { useGames } from '@/lib/games';
import GameCard from '@/components/app/game-card';
import { Skeleton } from '@/components/ui/skeleton';

export default function GamesPage() {
  const { data: games, isLoading } = useGames();

  return (
    <AppLayout title="All Games">
      <div className="mb-8 text-center">
        <h2 className="font-headline text-3xl font-bold">Game Library</h2>
        <p className="mt-2 text-muted-foreground">
          Choose from our collection of exciting games.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))
          : games?.map((game) => <GameCard key={game.id} game={game} />)}
      </div>
    </AppLayout>
  );
}
