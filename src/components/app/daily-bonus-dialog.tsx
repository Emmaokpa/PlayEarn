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

  const handleClaim = () => {
    onClaim();
    toast({
      title: (
        <div className="flex items-center gap-2">
          <PartyPopper className="h-5 w-5 text-accent" />
          <span className="font-bold">Bonus Claimed!</span>
        </div>
      ),
      description: "You've received 200 coins.",
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
          <p className="text-5xl font-bold text-primary">200</p>
          <p className="text-lg">Coins!</p>
        </div>
        <DialogFooter>
          <Button className="w-full" onClick={handleClaim}>
            Claim Your 200 Coins
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
