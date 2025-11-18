
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { games } from '@/lib/data';
import GameCard from '@/components/app/game-card';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/components/layout/app-layout';

export default function DashboardPage() {
  const exclusiveGames = games.slice(1, 4);
  const freeGames = games.slice(3);

  return (
    <AppLayout title="Explore">
      <div className="space-y-8">
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

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Exclusive Games</h2>
            <Link href="/games">
              <Button variant="link" className="text-primary">
                See All
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {exclusiveGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Try for free</h2>
            <Link href="/games">
              <Button variant="link" className="text-primary">
                See All
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {freeGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
