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
import { useToast } from '@/hooks/use-toast';
import { Coins, PartyPopper } from 'lucide-react';
import { mockUser } from '@/lib/data';

export default function DailyBonusDialog({
  open,
  onOpenChange,
  onClaim,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClaim: () => void;
}) {
  const { toast } = useToast();
  const bonusAmount = mockUser.isVip ? 600 : 200;

  const handleClaim = () => {
    onClaim();
    toast({
      title: (
        <div className="flex items-center gap-2">
          <PartyPopper className="h-5 w-5 text-accent" />
          <span className="font-bold">Bonus Claimed!</span>
        </div>
      ),
      description: `You've received ${bonusAmount} coins.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-headline">
            <Coins className="h-8 w-8 text-primary" />
            Daily Login Bonus
          </DialogTitle>
          <DialogDescription className="pt-2">
            Welcome back! Claim your daily bonus to keep the fun going.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 flex flex-col items-center justify-center space-y-2 rounded-lg bg-secondary p-8 text-secondary-foreground">
          <p className="text-lg">You've earned</p>
          <p className="text-5xl font-bold text-primary">{bonusAmount}</p>
          <p className="text-lg">Coins!</p>
        </div>
        <DialogFooter>
          <Button className="w-full" onClick={handleClaim}>
            Claim Your {bonusAmount} Coins
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
