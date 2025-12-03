
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
import { useUser } from '@/firebase';

export default function DailyBonusDialog({
  open,
  onOpenChange,
  onClaim,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClaim: (amount: number) => void;
}) {
  const { toast } = useToast();
  // We're leaving mockUser here just to get the isVip flag.
  // In a real app, this would come from the user's profile data, which we can get from the useUser hook.
  const { userData } = useUser();
  const isVip = userData?.isVip || false;
  const bonusAmount = isVip ? 60 : 20;

  const handleClaim = () => {
    onClaim(bonusAmount);
    toast({
      title: 'Bonus Claimed!',
      // The original code had an issue where `title` expected a string but received a React element.
      // If you intend to display an icon with the title, you might need a custom toast component
      // or render the icon within the description if it supports React nodes.
      // For now, I'm providing a string title to fix the type error.
      // If you want to keep the icon, you could move it to the description:
      // description: (<div className="flex items-center gap-2"><PartyPopper className="h-5 w-5 text-accent" /><span>You've received ${bonusAmount} coins.</span></div>),
      // or use a custom toast component that accepts React nodes for the title.
      description: `You've received ${bonusAmount} coins.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline text-2xl">
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
