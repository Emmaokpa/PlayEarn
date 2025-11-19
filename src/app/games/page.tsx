'use client';

import AppLayout from '@/components/layout/app-layout';
import type { Game } from '@/lib/data';
import GameCard from '@/components/app/game-card';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function GamesPage() {
  const { firestore } = useFirebase();

  const gamesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'games') : null),
    [firestore]
  );
  const { data: games, isLoading } = useCollection<Game>(gamesQuery);

  return (
    <AppLayout title="All Games">
      <div className="mb-8 text-center">
        <h2 className="font-headline text-3xl font-bold">Game Library</h2>
        <p className="mt-2 text-muted-foreground">
          Choose from our collection of exciting games.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))
          : games?.map((game) => <GameCard key={game.id} game={game} />)}
      </div>
    </AppLayout>
  );
}
