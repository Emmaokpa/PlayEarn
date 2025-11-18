import AppLayout from '@/components/layout/app-layout';
import { games } from '@/lib/data';
import GameCard from '@/components/app/game-card';

export default function GamesPage() {
  return (
    <AppLayout title="All Games">
       <div className="text-center mb-8">
            <h2 className="text-3xl font-bold font-headline">Game Library</h2>
            <p className="text-muted-foreground mt-2">Choose from our collection of exciting games.</p>
        </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </AppLayout>
  );
}
