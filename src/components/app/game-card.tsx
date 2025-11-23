import type { Game } from '@/lib/data';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

export default function GameCard({ game }: { game: Game }) {
  return (
    <Link href={`/games/${game.id}`} className="group block overflow-hidden rounded-2xl">
      <Card className="overflow-hidden h-full border-0 transition-all duration-300 group-hover:shadow-primary/20 group-hover:shadow-lg">
        <CardContent className="p-0 h-full">
          <div className="relative aspect-[3/4] h-full">
            <Image
              src={game.imageUrl}
              alt={game.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              data-ai-hint={game.imageHint}
              referrerPolicy="no-referrer"
              unoptimized
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
