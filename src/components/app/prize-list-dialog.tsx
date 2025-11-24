
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SpinPrize } from '@/lib/data';
import { Coins, Gift, ShoppingCart, Star, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface PrizeListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prizes: SpinPrize[];
}

function getRarity(probability: number) {
    if (probability < 0.5) return { label: 'Legendary', color: 'bg-yellow-500 text-yellow-foreground', className: 'animate-pulse' };
    if (probability < 5) return { label: 'Epic', color: 'bg-purple-600 text-purple-foreground' };
    if (probability < 15) return { label: 'Rare', color: 'bg-blue-600 text-blue-foreground' };
    return { label: 'Common', color: 'bg-gray-500 text-gray-foreground' };
}

function getPrizeDisplay(prize: SpinPrize) {
    let icon, text;

    switch(prize.type) {
      case 'coins':
        icon = <Coins className="h-6 w-6 text-primary" />;
        text = `${(prize.value as number).toLocaleString()} Coins`;
        break;
      case 'sticker':
        icon = <Star className="h-6 w-6 text-accent" />;
        text = `${prize.value} Sticker`;
        break;
      case 'entry':
        icon = <Ticket className="h-6 w-6 text-green-500" />;
        text = `$${prize.value} Gift Card Entry`;
        break;
      case 'gift_card':
         icon = <Gift className="h-6 w-6 text-yellow-400" />;
         text = prize.text === 'JACKPOT' ? 'JACKPOT!' : `$${prize.value} Gift Card`;
         break;
       default:
        return { icon: null, text: 'Unknown Prize' };
    }
  
  return { icon, text };
}

export default function PrizeListDialog({ open, onOpenChange, prizes }: PrizeListDialogProps) {
  const sortedPrizes = [...prizes].sort((a, b) => a.probability - b.probability);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Spin Wheel Prizes</DialogTitle>
          <DialogDescription className="text-center">
            Here are some of the amazing prizes you can win. The more you spin, the luckier you get!
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] overflow-y-auto pr-4">
            <ul className="space-y-3">
                {sortedPrizes.map(prize => {
                    const rarity = getRarity(prize.probability);
                    const { icon, text } = getPrizeDisplay(prize);
                    return (
                        <li key={prize.id} className={cn("flex items-center justify-between rounded-lg bg-secondary p-3", prize.text === 'JACKPOT' && "border-2 border-yellow-400/50")}>
                            <div className="flex items-center gap-3">
                                {icon}
                                <span className={cn("font-semibold", prize.text === 'JACKPOT' && 'text-yellow-400')}>{text}</span>
                            </div>
                             <Badge className={cn(rarity.color, rarity.className)}>{rarity.label}</Badge>
                        </li>
                    )
                })}
            </ul>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button asChild size="lg" className="w-full">
            <Link href="/store/buy-spins">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Buy Spins for Bigger Prizes!
            </Link>
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
