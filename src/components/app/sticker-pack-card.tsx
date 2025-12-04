
'use client';

import type { StickerPack } from '@/lib/data';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Coins, Star } from 'lucide-react';
import Link from 'next/link';

interface StickerPackCardProps {
  pack: StickerPack;
  userCoins: number;
}

const TELEGRAM_BOT_USERNAME = "gameshu_bot";

export default function StickerPackCard({ pack }: StickerPackCardProps) {
  
  // The payload format is `purchaseType|productId`
  const deepLink = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=purchase-stickerPacks-${pack.id}`;
  
  // Price for sticker packs is in coins, not real money
  const priceDisplayText = pack.price.toLocaleString();

  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="relative aspect-square">
          <Image
            src={pack.imageUrl}
            alt={pack.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            data-ai-hint={pack.imageHint}
            referrerPolicy="no-referrer"
            unoptimized
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-3">
        <CardTitle className="text-base truncate">{pack.name}</CardTitle>
        <CardDescription className="text-xs mt-1">{pack.description}</CardDescription>
      </CardContent>
      <CardFooter className="flex-col items-stretch bg-secondary/50 p-3 space-y-2">
        <div className="flex items-center justify-center gap-1 font-bold">
          <Coins className="h-4 w-4 text-primary" />
          <span>{priceDisplayText}</span>
        </div>
         <Button asChild size="sm">
            <Link href={deepLink} target="_blank" rel="noopener noreferrer">
                <Star className="h-4 w-4 mr-1" />
                Buy
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
