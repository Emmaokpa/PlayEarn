import type { Game } from '@/lib/data';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function GameCard({ game }: { game: Game }) {
  return (
    <Link href={`/games/${game.id}`} className="group">
      <Card className="overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-primary/20 group-hover:shadow-lg">
        <CardContent className="p-0">
          <div className="relative aspect-[3/4]">
            <Image
              src={game.imageUrl}
              alt={game.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
              data-ai-hint={game.imageHint}
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <div className="p-3 absolute bottom-0 left-0 right-0">
            <h3 className="font-bold truncate text-white">{game.name}</h3>
            <Badge variant="secondary" className="mt-1">
              {game.category}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
